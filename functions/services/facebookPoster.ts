export class FacebookPoster {
  private readonly GRAPH_API_VERSION = 'v21.0';

  /**
   * Post a news / discovery item to Facebook Page
   * @param caption Mizo storytelling caption
   * @param photoUrl Optional HD image URL or Base64 data
   * @param pageId Facebook Page ID
   * @param pageAccessToken Page Access Token
   */
  public async publishToPage(
    caption: string,
    photoUrl: string | undefined,
    pageId: string,
    pageAccessToken: string
  ): Promise<{ success: boolean; postId?: string; error?: string }> {
    const cleanId = (pageId || '').trim();
    const cleanToken = (pageAccessToken || '').trim();

    if (!cleanId || !cleanToken) {
      return {
        success: false,
        error: 'Facebook Page ID or Access Token is missing. Configure them in Settings or Cloudflare Secrets.',
      };
    }

    try {
      // 1. If photo is present
      if (photoUrl && photoUrl.trim()) {
        const cleanPhotoUrl = photoUrl.trim();

        // Case A: Direct Base64 data image upload
        if (cleanPhotoUrl.startsWith('data:image/')) {
          const commaIdx = cleanPhotoUrl.indexOf(',');
          const mimeMatch = cleanPhotoUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/);
          const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
          const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';

          const base64Data = cleanPhotoUrl.slice(commaIdx + 1);
          const binaryStr = atob(base64Data);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: mimeType });

          const formData = new FormData();
          formData.append('source', blob, `photo.${ext}`);
          if (caption && caption.trim()) {
            formData.append('caption', caption.trim());
          }
          formData.append('access_token', cleanToken);

          const uploadUrl = `https://graph.facebook.com/${this.GRAPH_API_VERSION}/${cleanId}/photos`;
          const res = await fetch(uploadUrl, {
            method: 'POST',
            body: formData,
          });

          const data = (await res.json()) as any;
          if (!res.ok || data.error) {
            const errDetail = data.error?.message || `HTTP ${res.status}`;
            console.error('[FacebookPoster] Base64 photo upload error:', data.error);
            return {
              success: false,
              error: `Facebook API photo error: ${errDetail}`,
            };
          }

          const postId = data.post_id || data.id;
          return { success: true, postId };
        }

        // Case B: Web URL photo upload
        if (cleanPhotoUrl.startsWith('http')) {
          const uploadUrl = `https://graph.facebook.com/${this.GRAPH_API_VERSION}/${cleanId}/photos`;
          const body = new URLSearchParams();
          body.append('url', cleanPhotoUrl);
          if (caption && caption.trim()) {
            body.append('caption', caption.trim());
          }
          body.append('access_token', cleanToken);

          const res = await fetch(uploadUrl, {
            method: 'POST',
            body,
          });

          const data = (await res.json()) as any;
          if (res.ok && !data.error) {
            const postId = data.post_id || data.id;
            return { success: true, postId };
          }

          console.warn(`[FacebookPoster] Photo URL upload failed (${data.error?.message}). Trying text feed fallback...`);
          // Fallback to text status feed post
        }
      }

      // 2. Pure text status update fallback
      const feedUrl = `https://graph.facebook.com/${this.GRAPH_API_VERSION}/${cleanId}/feed`;
      const body = new URLSearchParams();
      body.append('message', caption);
      body.append('access_token', cleanToken);

      const res = await fetch(feedUrl, {
        method: 'POST',
        body,
      });

      const data = (await res.json()) as any;
      if (!res.ok || data.error) {
        const errDetail = data.error?.message || `HTTP ${res.status}`;
        console.error('[FacebookPoster] Text post error:', data.error);
        return {
          success: false,
          error: `Facebook API error: ${errDetail}`,
        };
      }

      return {
        success: true,
        postId: data.id,
      };
    } catch (err: any) {
      console.error('[FacebookPoster] Unexpected posting exception:', err.message);
      return {
        success: false,
        error: err.message,
      };
    }
  }
}

export const facebookPoster = new FacebookPoster();
