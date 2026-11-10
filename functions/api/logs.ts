import { Env, SyncLogRecord } from '../types';

interface PagesFunctionContext {
  request: Request;
  env: Env;
}

export const onRequestGet = async (context: PagesFunctionContext): Promise<Response> => {
  const { request, env } = context;
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '40', 10), 100);

  try {
    const logs = await env.DB.prepare(
      `SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT ?`
    )
      .bind(limit)
      .all<SyncLogRecord>();

    return new Response(JSON.stringify({ success: true, logs: logs.results || [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};

export const onRequestDelete = async (context: PagesFunctionContext): Promise<Response> => {
  const { env } = context;

  try {
    await env.DB.prepare(`DELETE FROM sync_logs`).run();
    return new Response(JSON.stringify({ success: true, message: 'Logs cleared' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};
