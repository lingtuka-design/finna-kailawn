import { Env, PostRecord } from '../types';
import { geminiStoryteller } from '../services/geminiStoryteller';

interface PagesFunctionContext {
  request: Request;
  env: Env;
}

export const onRequestPost = async (context: PagesFunctionContext): Promise<Response> => {
  const { request, env } = context;

  try {
    const body = (await request.json()) as any;
    const { postId, title, text, category = 'facts', customInstruction } = body;

    let targetTitle = title || '';
    let targetText = text || '';
    let targetCategory = category;

    if (postId) {
      const post = await env.DB.prepare(`SELECT * FROM posts WHERE id = ?`).bind(postId).first<PostRecord>();
      if (post) {
        targetTitle = title || post.original_title || '';
        targetText = text || post.original_text || '';
        targetCategory = post.category || category;
      }
    }

    if (!targetText && !targetTitle) {
      return new Response(JSON.stringify({ success: false, error: 'Text or Title required for translation' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const geminiKey = env.GEMINI_API_KEY;
    const geminiKey2 = env.GEMINI_API_KEY_2 || env.GEMINI_API_KEY_FALLBACK;

    // Check if key is also saved in settings
    let keyToUse = geminiKey;
    if (!keyToUse) {
      const setting = await env.DB.prepare(`SELECT value FROM settings WHERE key = 'gemini_api_key'`).first<{ value: string }>();
      keyToUse = setting?.value;
    }

    if (!keyToUse) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Gemini API key is not configured. Please set GEMINI_API_KEY in Secrets or Settings.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    const result = await geminiStoryteller.tellStory(
      targetTitle,
      targetText,
      targetCategory,
      keyToUse,
      geminiKey2,
      customInstruction
    );

    // If a postId was provided, update it in DB
    if (postId) {
      await env.DB.prepare(
        `UPDATE posts 
         SET mizo_title = ?, mizo_caption = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`
      )
        .bind(result.mizoTitle || targetTitle, result.mizoCaption, postId)
        .run();
    }

    return new Response(
      JSON.stringify({
        success: true,
        mizoTitle: result.mizoTitle,
        mizoCaption: result.mizoCaption,
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

export const onRequestOptions = async (): Promise<Response> => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
