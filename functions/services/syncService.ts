import { Env, CollectedItem, SourceRecord } from '../types';
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

    // 3. Collect from each source
    for (const source of sources.results) {
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

        // Process each collected item
        for (const item of collected) {
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

          newItems++;

          let mizoTitle = '';
          let mizoCaption = '';
          let status: 'draft' | 'queued' = 'draft';
          let scheduledFor: string | null = null;

          if (shouldAutoTranslate && (geminiKey || backupKey)) {
            try {
              const translated = await geminiStoryteller.tellStory(
                item.title,
                item.text,
                item.category,
                geminiKey,
                geminiKey2,
                undefined,
                backupKey
              );
              mizoTitle = translated.mizoTitle || item.title;
              mizoCaption = translated.mizoCaption;
              status = 'queued';

              scheduledFor = await queueManager.getNextScheduleTime(env.DB, intervalHours);
              queued++;
            } catch (err: any) {
              console.warn(`[SyncService] Translation failed for ${item.title}:`, err.message);
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
