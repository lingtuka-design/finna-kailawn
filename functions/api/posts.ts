import { Env, PostRecord } from '../types';

interface PagesFunctionContext {
  request: Request;
  env: Env;
}

export const onRequestGet = async (context: PagesFunctionContext): Promise<Response> => {
  const { request, env } = context;
  const url = new URL(request.url);

  const status = url.searchParams.get('status') || ''; // 'queued', 'published', 'draft', 'failed'
  const category = url.searchParams.get('category') || '';
  const search = url.searchParams.get('search') || '';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  try {
    let query = `SELECT * FROM posts WHERE 1=1`;
    const params: any[] = [];

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    if (category) {
      query += ` AND category = ?`;
      params.push(category);
    }

    if (search) {
      query += ` AND (original_title LIKE ? OR mizo_title LIKE ? OR mizo_caption LIKE ? OR original_text LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    // Order by scheduled_for ASC for queued, or created_at DESC for others
    if (status === 'queued') {
      query += ` ORDER BY scheduled_for ASC, id ASC LIMIT ? OFFSET ?`;
    } else {
      query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    }
    params.push(limit, offset);

    const stmt = env.DB.prepare(query);
    const result = await stmt.bind(...params).all<PostRecord>();

    // Count summary
    const counts = await env.DB.prepare(
      `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN status = 'queued' THEN 1 ELSE 0 END) as queued,
         SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
         SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
         SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
       FROM posts`
    ).first<{ total: number; queued: number; published: number; draft: number; failed: number }>();

    return new Response(
      JSON.stringify({
        success: true,
        posts: result.results || [],
        counts: counts || { total: 0, queued: 0, published: 0, draft: 0, failed: 0 },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
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
    const {
      title,
      text,
      mizoTitle,
      mizoCaption,
      imageUrl,
      category = 'facts',
      status = 'queued',
      scheduledFor,
    } = body;

    if (!text && !mizoCaption) {
      return new Response(JSON.stringify({ success: false, error: 'Text or caption is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const externalId = `manual:${Date.now()}:${Math.random().toString(36).substring(2, 7)}`;

    const res = await env.DB.prepare(
      `INSERT INTO posts (
        source_id, source_type, external_id, original_title, original_text,
        image_url, mizo_title, mizo_caption, category, status, scheduled_for,
        created_at, updated_at
      ) VALUES ('manual', 'manual', ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    )
      .bind(
        externalId,
        title || mizoTitle || 'Manual Entry',
        text || mizoCaption || '',
        imageUrl || null,
        mizoTitle || title || null,
        mizoCaption || null,
        category,
        status,
        scheduledFor || null
      )
      .run();

    return new Response(
      JSON.stringify({ success: true, message: 'Post created', id: res.meta.last_row_id }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};

export const onRequestPut = async (context: PagesFunctionContext): Promise<Response> => {
  const { request, env } = context;

  try {
    const body = (await request.json()) as any;
    const { id, mizoTitle, mizoCaption, imageUrl, status, scheduledFor, category } = body;

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: 'Post ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Build dynamic UPDATE query (sanitizes undefined to prevent D1_TYPE_ERROR)
    const updates: string[] = [];
    const params: any[] = [];

    if (mizoTitle !== undefined) {
      updates.push('mizo_title = ?');
      params.push(mizoTitle);
    }
    if (mizoCaption !== undefined) {
      updates.push('mizo_caption = ?');
      params.push(mizoCaption);
    }
    if (imageUrl !== undefined) {
      updates.push('image_url = ?');
      params.push(imageUrl);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    if (scheduledFor !== undefined) {
      updates.push('scheduled_for = ?');
      params.push(scheduledFor);
    }
    if (category !== undefined) {
      updates.push('category = ?');
      params.push(category);
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No fields to update' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await env.DB.prepare(
      `UPDATE posts SET ${updates.join(', ')} WHERE id = ?`
    )
      .bind(...params)
      .run();

    return new Response(JSON.stringify({ success: true, message: 'Post updated successfully' }), {
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
  const { request, env } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return new Response(JSON.stringify({ success: false, error: 'Post ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    await env.DB.prepare(`DELETE FROM posts WHERE id = ?`).bind(id).run();
    return new Response(JSON.stringify({ success: true, message: 'Post deleted successfully' }), {
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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};
