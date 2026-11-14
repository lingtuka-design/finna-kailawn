import { Env, PostRecord } from '../types';
import { facebookPoster } from '../services/facebookPoster';

interface PagesFunctionContext {
  request: Request;
  env: Env;
}

export const onRequestPost = async (context: PagesFunctionContext): Promise<Response> => {
  const { request, env } = context;

  try {
    const body = (await request.json()) as any;
    const { postId } = body;

    if (!postId) {
      return new Response(JSON.stringify({ success: false, error: 'Post ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const post = await env.DB.prepare(`SELECT * FROM posts WHERE id = ?`).bind(postId).first<PostRecord>();
    if (!post) {
      return new Response(JSON.stringify({ success: false, error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Facebook credentials: Check DB settings first (allows real-time updates via UI), fallback to env secrets
    const idSetting = await env.DB.prepare(`SELECT value FROM settings WHERE key = 'fb_page_id'`).first<{ value: string }>();
    const tokenSetting = await env.DB.prepare(`SELECT value FROM settings WHERE key = 'fb_access_token'`).first<{ value: string }>();

    let fbPageId = idSetting?.value?.trim() || env.FB_PAGE_ID;
    let fbAccessToken = tokenSetting?.value?.trim() || env.FB_PAGE_ACCESS_TOKEN;

    if (!fbPageId || !fbAccessToken) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Facebook Page ID or Access Token is missing. Please configure them in Settings.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    const caption = post.mizo_caption || post.mizo_title || post.original_text;
    const photoUrl = post.image_url || undefined;

    const result = await facebookPoster.publishToPage(caption, photoUrl, fbPageId, fbAccessToken);

    if (result.success) {
      const publishedAt = new Date().toISOString();
      await env.DB.prepare(
        `UPDATE posts 
         SET status = 'published', published_at = ?, fb_post_id = ?, error_message = NULL, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`
      )
        .bind(publishedAt, result.postId || 'OK', postId)
        .run();

      await env.DB.prepare(
        `INSERT INTO sync_logs (action, status, message, details) VALUES ('publish', 'success', ?, ?)`
      )
        .bind(`Post #${postId} published manually to Facebook`, `FB ID: ${result.postId}`)
        .run();

      return new Response(
        JSON.stringify({
          success: true,
          postId: result.postId,
          publishedAt,
          message: 'Post successfully published to Facebook Page!',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    } else {
      await env.DB.prepare(
        `UPDATE posts SET status = 'failed', error_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      )
        .bind(result.error || 'Publish failed', postId)
        .run();

      await env.DB.prepare(
        `INSERT INTO sync_logs (action, status, message, details) VALUES ('publish', 'error', ?, ?)`
      )
        .bind(`Post #${postId} manual publish failed`, result.error || null)
        .run();

      return new Response(JSON.stringify({ success: false, error: result.error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
