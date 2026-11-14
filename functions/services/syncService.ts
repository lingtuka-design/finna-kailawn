import { Env, CollectedItem, SourceRecord, StorytellerResult } from '../types';
import { rssCollector } from './rssCollector';
import { nasaCollector } from './nasaCollector';
import { twitterCollector } from './twitterCollector';
import { geminiStoryteller } from './geminiStoryteller';
import { queueManager } from './queueManager';

export class SyncService {
  /**
   * Sync active sources and queue new facts/discoveries
   */
  public async syncAllSources(env: Env, specificSourceId?: string): Promise<{
    found: number;
    newItems: number;
    queued: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let found = 0;
    let newItems = 0;
    let queued = 0;

    // 1. Get enabled sources
    let sourcesQuery = `SELECT * FROM sources WHERE enabled = 1`;
    if (specificSourceId) {
      sourcesQuery = `SELECT * FROM sources WHERE id = '${specificSourceId.replace(/'/g, "''")}'`;
    }

    const sources = await env.DB.prepare(sourcesQuery).all<SourceRecord>();
    if (!sources.results || sources.results.length === 0) {
      return { found: 0, newItems: 0, queued: 0, errors: ['No active sources found to sync'] };
    }

    // 2. Read settings
    const autoTranslateSetting = await env.DB.prepare(
      `SELECT value FROM settings WHERE key = 'auto_translate_on_sync'`
    ).first<{ value: string }>();
    const shouldAutoTranslate = autoTranslateSetting?.value !== 'false';

    const intervalSetting = await env.DB.prepare(
      `SELECT value FROM settings WHERE key = 'drip_interval_hours'`
    ).first<{ value: string }>();
    const intervalHours = parseInt(intervalSetting?.value || '4', 10) || 4;

    const geminiKey = env.GEMINI_API_KEY;
    const geminiKey2 = env.GEMINI_API_KEY_FALLBACK || env.GEMINI_API_KEY_2;
    const backupKey = env.GEMINI_API_KEY_BACKUP;

    const seenInBatch = new Set<string>();
    const MAX_TOTAL_NEW = 10; // Curate top 10 facts per batch
    const MAX_PER_SOURCE = 2; // Up to 2 best facts per source for balanced variety
    const candidateItems: CollectedItem[] = [];

    // 3. Step 1: Collect top quality candidate items across active sources
    for (const source of sources.results) {
      if (candidateItems.length >= MAX_TOTAL_NEW) {
        break; // Reached curated daily target
      }

      try {
        let collected: CollectedItem[] = [];

        if (source.type === 'rss') {
          collected = await rssCollector.fetchFeed(source.id, source.url, source.category);
        } else if (source.type === 'nasa') {
          collected = await nasaCollector.fetchRecentApod(env.NASA_API_KEY, 3);
        } else if (source.type === 'twitter') {
          collected = await twitterCollector.getRecentTweets(source.url, source.category, 6);
        }

        found += collected.length;

        // Quality Filter: Prioritize items with HD images and meaningful content
        const qualityItems = collected.filter((item) => {
          const hasImage = Boolean(item.imageUrl && item.imageUrl.trim());
          const hasGoodLength = item.text && item.text.length >= 80;
          return hasImage && hasGoodLength;
        });

        let sourceAdded = 0;

        // Filter and collect candidate items
        for (const item of qualityItems) {
          if (sourceAdded >= MAX_PER_SOURCE || candidateItems.length >= MAX_TOTAL_NEW) {
            break;
          }

          if (!item.externalId || seenInBatch.has(item.externalId)) {
            continue;
          }
          seenInBatch.add(item.externalId);

          // Check deduplication in database
          const existing = await env.DB.prepare(
            `SELECT id FROM posts WHERE external_id = ? LIMIT 1`
          )
            .bind(item.externalId)
            .first<{ id: number }>();

          if (existing) {
            continue; // Already processed
          }

          candidateItems.push(item);
          sourceAdded++;
          newItems++;
        }

        // Update source last_scraped_at
        await env.DB.prepare(
          `UPDATE sources SET last_scraped_at = CURRENT_TIMESTAMP WHERE id = ?`
        )
          .bind(source.id)
          .run();
      } catch (err: any) {
        errors.push(`Error syncing ${source.name}: ${err.message}`);
        console.error(`[SyncService] Source error (${source.name}):`, err);
      }
    }

    // 4. Step 2: Batch translate all collected candidate items in ONE single API call (saves 90%+ quota!)
    let batchMap = new Map<string, StorytellerResult>();
    if (shouldAutoTranslate && candidateItems.length > 0 && (geminiKey || backupKey)) {
      try {
        batchMap = await geminiStoryteller.tellStoriesBatch(
          candidateItems.map((it) => ({
            id: it.externalId,
            title: it.title,
            text: it.text,
            category: it.category,
          })),
          geminiKey,
          geminiKey2,
          backupKey
        );
      } catch (err: any) {
        console.warn('[SyncService] Batch translation failed, will fall back to single translations:', err.message);
      }
    }

    // 5. Step 3: Insert posts and schedule them in the drip queue
    for (const item of candidateItems) {
      let mizoTitle = '';
      let mizoCaption = '';
      let status: 'draft' | 'queued' = 'draft';
      let scheduledFor: string | null = null;

      const batchResult = batchMap.get(item.externalId);
      if (batchResult && batchResult.mizoCaption.trim()) {
        mizoTitle = batchResult.mizoTitle || item.title;
        mizoCaption = batchResult.mizoCaption;
        status = 'queued';
        scheduledFor = await queueManager.getNextScheduleTime(env.DB, intervalHours);
        queued++;
      } else if (shouldAutoTranslate && (geminiKey || backupKey)) {
        // Fallback: Translate individually if missed in batch
        try {
          const single = await geminiStoryteller.tellStory(
            item.title,
            item.text,
            item.category,
            geminiKey,
            geminiKey2,
            undefined,
            backupKey
          );
          mizoTitle = single.mizoTitle || item.title;
          mizoCaption = single.mizoCaption;
          status = 'queued';
          scheduledFor = await queueManager.getNextScheduleTime(env.DB, intervalHours);
          queued++;
        } catch (err: any) {
          console.warn(`[SyncService] Fallback translation failed for ${item.title}:`, err.message);
          mizoTitle = item.title;
          mizoCaption = item.text;
          status = 'draft';
        }
      }

      // Insert into posts table (INSERT OR IGNORE ensures 0 collision errors)
      await env.DB.prepare(
        `INSERT OR IGNORE INTO posts (
          source_id, source_type, external_id, original_title, original_text,
          original_url, image_url, mizo_title, mizo_caption, category,
          status, scheduled_for, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      )
        .bind(
          item.sourceId,
          item.sourceType,
          item.externalId,
          item.title,
          item.text,
          item.url,
          item.imageUrl || null,
          mizoTitle || null,
          mizoCaption || null,
          item.category,
          status,
          scheduledFor
        )
        .run();
    }

    // Record sync log
    await env.DB.prepare(
      `INSERT INTO sync_logs (action, status, message, details, items_count) 
       VALUES ('sync', ?, ?, ?, ?)`
    )
      .bind(
        errors.length === 0 ? 'success' : 'warning',
        `Sync completed: ${newItems} new items (${queued} auto-queued)`,
        errors.join('; ') || null,
        newItems
      )
      .run();

    return { found, newItems, queued, errors };
  }
}

export const syncService = new SyncService();
