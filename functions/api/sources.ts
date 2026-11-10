import { Env, SourceRecord } from '../types';

interface PagesFunctionContext {
  request: Request;
  env: Env;
}

export const onRequestGet = async (context: PagesFunctionContext): Promise<Response> => {
  const { env } = context;

  try {
    const sources = await env.DB.prepare(`SELECT * FROM sources ORDER BY created_at ASC`).all<SourceRecord>();
    return new Response(JSON.stringify({ success: true, sources: sources.results || [] }), {
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
    const { id, name, type, url, avatarUrl, category = 'science', enabled = 1 } = body;

    if (!id || !name || !type || !url) {
      return new Response(JSON.stringify({ success: false, error: 'Missing required source fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    await env.DB.prepare(
      `INSERT INTO sources (id, name, type, url, avatar_url, category, enabled)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         type = excluded.type,
         url = excluded.url,
         avatar_url = excluded.avatar_url,
         category = excluded.category,
         enabled = excluded.enabled`
    )
      .bind(id, name, type, url, avatarUrl || null, category, enabled ? 1 : 0)
      .run();

    return new Response(JSON.stringify({ success: true, message: 'Source saved successfully' }), {
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

export const onRequestPatch = async (context: PagesFunctionContext): Promise<Response> => {
  const { request, env } = context;

  try {
    const body = (await request.json()) as any;
    const { id, enabled } = body;

    if (!id || typeof enabled === 'undefined') {
      return new Response(JSON.stringify({ success: false, error: 'Source ID and enabled status required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    await env.DB.prepare(`UPDATE sources SET enabled = ? WHERE id = ?`).bind(enabled ? 1 : 0, id).run();

    return new Response(JSON.stringify({ success: true, message: 'Source updated' }), {
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
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
