import { Env } from '../types';
import { syncService } from '../services/syncService';
import { queueManager } from '../services/queueManager';

interface PagesFunctionContext {
  request: Request;
  env: Env;
  waitUntil: (promise: Promise<any>) => void;
}

export const onRequestPost = async (context: PagesFunctionContext): Promise<Response> => {
  const { request, env } = context;

  // Optional: check secret if CRON_SECRET is configured
  const authHeader = request.headers.get('Authorization') || '';
  const url = new URL(request.url);
  const secretParam = url.searchParams.get('secret') || '';

  if (env.CRON_SECRET) {
    const bearer = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (bearer !== env.CRON_SECRET && secretParam !== env.CRON_SECRET) {
      return new Response(JSON.stringify({ error: 'Unauthorized CRON trigger' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  try {
    const body = await request.json().catch(() => ({})) as any;
    const mode = body.mode || url.searchParams.get('mode') || 'all'; // 'all', 'sync_only', 'publish_only'
    const sourceId = body.sourceId || url.searchParams.get('sourceId') || undefined;

    let syncResult = null;
    let publishResult = null;

    if (mode === 'all' || mode === 'sync_only') {
      syncResult = await syncService.syncAllSources(env, sourceId);
    }

    if (mode === 'all' || mode === 'publish_only') {
      publishResult = await queueManager.processQueue(env);
    }

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        sync: syncResult,
        publish: publishResult,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: any) {
    console.error('[API /sync] Error:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || 'Internal server error during sync',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
};

export const onRequestOptions = async (): Promise<Response> => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};
