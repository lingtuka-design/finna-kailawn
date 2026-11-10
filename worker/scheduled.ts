/**
 * Cloudflare Scheduled Worker for Finna Kailawn
 * Runs 24/7 on Cloudflare Edge:
 * - Every 1 minute: Checks drip queue and auto-publishes any due post to Facebook Page.
 * - Every 30 minutes: Syncs active sources (RSS, NASA, Twitter) in the background.
 */

export interface WorkerEnv {
  KHAWVEL_PAGES_URL?: string; // e.g. "https://finna-kailawn.pages.dev"
  CRON_SECRET?: string;
}

export default {
  async scheduled(event: ScheduledEvent, env: WorkerEnv, ctx: ExecutionContext): Promise<void> {
    const scheduledDate = new Date(event.scheduledTime);
    const minute = scheduledDate.getUTCMinutes();
    const baseUrl = (env.KHAWVEL_PAGES_URL || 'https://finna-kailawn.pages.dev').replace(/\/$/, '');

    const headers: Record<string, string> = {
      'User-Agent': 'FinnaKailawn-Cron-Worker/1.0',
      'Content-Type': 'application/json',
    };

    if (env.CRON_SECRET) {
      headers['Authorization'] = `Bearer ${env.CRON_SECRET}`;
    }

    // 1. Queue Publisher: Runs every 1 minute to check for due posts
    ctx.waitUntil(
      fetch(`${baseUrl}/api/sync?mode=publish_only`, {
        method: 'POST',
        headers,
      })
        .then(async (res) => {
          const body = await res.text();
          console.log(`[Khawvel Cron] Queue Check: HTTP ${res.status} - ${body.slice(0, 100)}`);
        })
        .catch((err) => {
          console.error('[Khawvel Cron] Queue check error:', err.message);
        })
    );

    // 2. Source Sync: Runs every 30 minutes (minute % 30 === 0) to collect fresh facts/discoveries
    if (minute % 30 === 0) {
      ctx.waitUntil(
        fetch(`${baseUrl}/api/sync?mode=sync_only`, {
          method: 'POST',
          headers,
        })
          .then(async (res) => {
            const body = await res.text();
            console.log(`[Khawvel Cron] Periodic Source Sync: HTTP ${res.status} - ${body.slice(0, 100)}`);
          })
          .catch((err) => {
            console.error('[Khawvel Cron] Source sync error:', err.message);
          })
      );
    }
  },

  /**
   * Manual HTTP trigger for testing
   */
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const baseUrl = (env.KHAWVEL_PAGES_URL || 'https://finna-kailawn.pages.dev').replace(/\/$/, '');
    const headers: Record<string, string> = {
      'User-Agent': 'FinnaKailawn-Cron-Worker/1.0',
      'Content-Type': 'application/json',
    };
    if (env.CRON_SECRET) {
      headers['Authorization'] = `Bearer ${env.CRON_SECRET}`;
    }

    const res = await fetch(`${baseUrl}/api/sync?mode=all`, {
      method: 'POST',
      headers,
    });

    const data = await res.text();
    return new Response(data, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
