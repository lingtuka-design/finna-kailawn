import { CollectedItem } from '../types';

export class NasaCollector {
  private defaultKey = 'DEMO_KEY';

  /**
   * Fetch recent NASA Astronomy Picture of the Day items
   */
  public async fetchRecentApod(apiKey?: string, count: number = 3): Promise<CollectedItem[]> {
    const key = (apiKey || '').trim() || this.defaultKey;
    const items: CollectedItem[] = [];

    try {
      // Fetch recent days using count parameter or today
      const url = `https://api.nasa.gov/planetary/apod?api_key=${encodeURIComponent(key)}&count=${count}&thumbs=true`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Khawvel-Bot/1.0',
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`NASA APOD API error HTTP ${res.status}`);
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : [data];

      for (const entry of list) {
        if (!entry || !entry.title) continue;

        // Determine image URL
        const photoUrl = entry.hdurl || entry.url || entry.thumbnail_url;
        if (!photoUrl) continue;

        const dateStr = entry.date || new Date().toISOString().split('T')[0];
        const externalId = `nasa:apod:${dateStr}`;

        items.push({
          sourceId: 'nasa_apod',
          sourceType: 'nasa',
          externalId,
          title: entry.title.trim(),
          text: (entry.explanation || entry.title).trim(),
          url: entry.url || `https://apod.nasa.gov/apod/ap${dateStr.replace(/-/g, '').slice(2)}.html`,
          imageUrl: photoUrl,
          category: 'space',
          publishedAt: new Date(dateStr).toISOString(),
        });
      }
    } catch (err: any) {
      console.error('[NasaCollector] Error fetching NASA APOD:', err.message);
    }

    return items;
  }
}

export const nasaCollector = new NasaCollector();
