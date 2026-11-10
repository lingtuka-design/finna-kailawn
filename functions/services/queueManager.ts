import { Env, PostRecord } from '../types';
import { facebookPoster } from './facebookPoster';

export class QueueManager {
  /**
   * Determine the next available schedule timestamp for a newly queued post
   */
  public async getNextScheduleTime(
    db: D1Database,
    preferredIntervalHours = 4,
    scheduleSlots = ['09:00', '13:00', '17:00', '21:00']
  ): Promise<string> {
    // 1. Find the latest scheduled post in queue
    const latestQueued = await db
      .prepare(
        `SELECT scheduled_for FROM posts 
         WHERE status = 'queued' AND scheduled_for IS NOT NULL 
         ORDER BY scheduled_for DESC LIMIT 1`
      )
      .first<{ scheduled_for: string }>();

    const now = new Date();
    let baseTime = now;

    if (latestQueued?.scheduled_for) {
      const latestDate = new Date(latestQueued.scheduled_for);
      if (latestDate > now) {
        baseTime = latestDate;
      }
    }

    // If using fixed schedule slots (e.g. 09:00, 13:00, 17:00, 21:00 IST)
    // Add interval to baseTime or find next slot
    const candidate = new Date(baseTime.getTime() + preferredIntervalHours * 60 * 60 * 1000);

    // Round to nearest 15 or 30 minutes for clean schedule timestamps
    const minutes = candidate.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 15) * 15;
    candidate.setMinutes(roundedMinutes, 0, 0);

    return candidate.toISOString();
  }

  /**
   * Check queue and publish due posts (called by Cron trigger or manual sync)
   */
  public async processQueue(env: Env): Promise<{ published: number; errors: number; details: string[] }> {
    const details: string[] = [];
    let published = 0;
    let errors = 0;

    // Check if auto-publish is enabled in settings
    const autoSetting = await env.DB.prepare(
      `SELECT value FROM settings WHERE key = 'auto_publish_enabled'`
    ).first<{ value: string }>();

    if (autoSetting?.value === 'false') {
      return { published: 0, errors: 0, details: ['Auto-publish is disabled in settings'] };
    }

    // Fetch Facebook credentials from env or DB settings
    let fbPageId = env.FB_PAGE_ID;
    let fbAccessToken = env.FB_PAGE_ACCESS_TOKEN;

    if (!fbPageId || !fbAccessToken) {
      const idSetting = await env.DB.prepare(`SELECT value FROM settings WHERE key = 'fb_page_id'`).first<{ value: string }>();
      const tokenSetting = await env.DB.prepare(`SELECT value FROM settings WHERE key = 'fb_access_token'`).first<{ value: string }>();
      if (idSetting?.value) fbPageId = idSetting.value;
      if (tokenSetting?.value) fbAccessToken = tokenSetting.value;
    }

    if (!fbPageId || !fbAccessToken) {
      return {
        published: 0,
        errors: 1,
        details: ['Missing Facebook credentials (Page ID or Access Token).'],
      };
    }

    // Query posts due for publishing
    const nowIso = new Date().toISOString();
    const duePosts = await env.DB.prepare(
      `SELECT * FROM posts 
       WHERE status = 'queued' AND (scheduled_for IS NULL OR scheduled_for <= ?) 
       ORDER BY scheduled_for ASC LIMIT 2`
    )
      .bind(nowIso)
      .all<PostRecord>();

    if (!duePosts.results || duePosts.results.length === 0) {
      return { published: 0, errors: 0, details: ['No posts due for publication'] };
    }

    for (const post of duePosts.results) {
      const caption = post.mizo_caption || post.mizo_title || post.original_text;
      const photoUrl = post.image_url || undefined;

      const result = await facebookPoster.publishToPage(
        caption,
        photoUrl,
        fbPageId,
        fbAccessToken
      );

      if (result.success) {
        published++;
        await env.DB.prepare(
          `UPDATE posts 
           SET status = 'published', published_at = ?, fb_post_id = ?, error_message = NULL, updated_at = CURRENT_TIMESTAMP 
           WHERE id = ?`
        )
          .bind(new Date().toISOString(), result.postId || 'OK', post.id)
          .run();

        details.push(`Published post #${post.id} (FB ID: ${result.postId})`);
      } else {
        errors++;
        await env.DB.prepare(
          `UPDATE posts 
           SET status = 'failed', error_message = ?, updated_at = CURRENT_TIMESTAMP 
           WHERE id = ?`
        )
          .bind(result.error || 'Publish failed', post.id)
          .run();

        details.push(`Failed post #${post.id}: ${result.error}`);
      }
    }

    return { published, errors, details };
  }
}

export const queueManager = new QueueManager();
