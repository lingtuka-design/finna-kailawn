import { Env } from '../types';

interface PagesFunctionContext {
  request: Request;
  env: Env;
}

export const onRequestGet = async (context: PagesFunctionContext): Promise<Response> => {
  const { env } = context;

  try {
    const rows = await env.DB.prepare(`SELECT key, value FROM settings`).all<{ key: string; value: string }>();
    const settingsMap: Record<string, string> = {};

    for (const r of rows.results || []) {
      settingsMap[r.key] = r.value;
    }

    // Include masked environment secrets status
    const status = {
      hasGeminiKey: !!(env.GEMINI_API_KEY || settingsMap['gemini_api_key']),
      hasFbPageId: !!(env.FB_PAGE_ID || settingsMap['fb_page_id']),
      hasFbToken: !!(env.FB_PAGE_ACCESS_TOKEN || settingsMap['fb_access_token']),
      hasCronSecret: !!env.CRON_SECRET,
    };

    return new Response(JSON.stringify({ success: true, settings: settingsMap, status }), {
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

export const onRequestPost = async (context: PagesFunctionContext): Promise<Response> => {
  const { request, env } = context;

  try {
    const body = (await request.json()) as any;
    const { settings } = body; // key-value object

    if (!settings || typeof settings !== 'object') {
      return new Response(JSON.stringify({ success: false, error: 'Settings object required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const stmts = Object.entries(settings).map(([k, v]) =>
      env.DB.prepare(
        `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
      ).bind(k, String(v))
    );

    if (stmts.length > 0) {
      await env.DB.batch(stmts);
    }

    return new Response(JSON.stringify({ success: true, message: 'Settings saved successfully' }), {
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

export const onRequestOptions = async (): Promise<Response> => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
