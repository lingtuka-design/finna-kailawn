import { CollectedItem } from '../types';

export class RssCollector {
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 (Khawvel-Bot/1.0)';

  /**
   * Fetch and parse an RSS or Atom feed
   */
  public async fetchFeed(
    sourceId: string,
    feedUrl: string,
    category: 'science' | 'nature' | 'history' | 'space' | 'general' = 'science'
  ): Promise<CollectedItem[]> {
    try {
      const res = await fetch(feedUrl, {
        headers: {
          'User-Agent': this.userAgent,
          Accept: 'application/rss+xml, application/xml, text/xml, */*',
        },
      });

      if (!res.ok) {
        throw new Error(`Feed request failed with HTTP ${res.status}`);
      }

      const xml = await res.text();
      return this.parseFeedXml(xml, sourceId, category);
    } catch (err: any) {
      console.error(`[RssCollector] Error fetching ${sourceId} (${feedUrl}):`, err.message);
      return [];
    }
  }

  /**
   * Parse XML string into standardized CollectedItem array
   */
  public parseFeedXml(
    xml: string,
    sourceId: string,
    category: 'science' | 'nature' | 'history' | 'space' | 'general'
  ): CollectedItem[] {
    const items: CollectedItem[] = [];

    // Match both RSS <item>...</item> and Atom <entry>...</entry>
    const itemRegex = /<(?:item|entry)[\s>]([\s\S]*?)<\/(?:item|entry)>/gi;
    let match: RegExpExecArray | null;

    while ((match = itemRegex.exec(xml)) !== null) {
      const block = match[1];

      // 1. Title
      const title = this.extractTag(block, 'title') || '';
      const cleanTitle = this.cleanHtmlEntities(this.stripHtml(title));

      // 2. Link
      let link = this.extractTag(block, 'link');
      if (!link) {
        // Check Atom <link href="..." />
        const atomLinkMatch = block.match(/<link[^>]+href=["']([^"']+)["']/i);
        link = atomLinkMatch ? atomLinkMatch[1] : '';
      }

      // 3. GUID / Unique ID
      let guid = this.extractTag(block, 'guid') || this.extractTag(block, 'id') || link;
      guid = guid.trim();
      const externalId = `rss:${sourceId}:${this.hashOrSlug(guid || link || cleanTitle)}`;

      // 4. Description / Content
      const contentEncoded = this.extractTag(block, 'content:encoded');
      const description = this.extractTag(block, 'description') || this.extractTag(block, 'summary') || '';
      const fullContent = contentEncoded || description;
      const cleanText = this.cleanHtmlEntities(this.stripHtml(fullContent || title));

      // 5. Image Extraction (High-res priority)
      const imageUrl = this.extractImageUrl(block, fullContent);

      // 6. PubDate
      const pubDate = this.extractTag(block, 'pubDate') || this.extractTag(block, 'published') || this.extractTag(block, 'updated');

      if (cleanTitle && cleanText) {
        items.push({
          sourceId,
          sourceType: 'rss',
          externalId,
          title: cleanTitle,
          text: cleanText,
          url: link.trim(),
          imageUrl: imageUrl || undefined,
          category,
          publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        });
      }
    }

    return items;
  }

  /**
   * Extract image URL with priority for highest quality
   */
  private extractImageUrl(block: string, content: string): string | null {
    // Check media:content (e.g. LiveScience, BBC)
    const mediaContentMatch = block.match(/<media:content[^>]+url=["']([^"']+)["'][^>]*>/i);
    if (mediaContentMatch && this.isImageExt(mediaContentMatch[1])) {
      return this.cleanImageUrl(mediaContentMatch[1]);
    }

    // Check enclosure (e.g. podcasts or photo feeds)
    const enclosureMatch = block.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*>/i);
    if (enclosureMatch && this.isImageExt(enclosureMatch[1])) {
      return this.cleanImageUrl(enclosureMatch[1]);
    }

    // Check media:thumbnail
    const mediaThumbMatch = block.match(/<media:thumbnail[^>]+url=["']([^"']+)["'][^>]*>/i);
    if (mediaThumbMatch && this.isImageExt(mediaThumbMatch[1])) {
      return this.cleanImageUrl(mediaThumbMatch[1]);
    }

    // Check <img> tag in HTML content
    const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
    if (imgMatch && this.isImageExt(imgMatch[1])) {
      return this.cleanImageUrl(imgMatch[1]);
    }

    return null;
  }

  private isImageExt(url: string): boolean {
    if (!url) return false;
    const lower = url.toLowerCase();
    return (
      lower.includes('.jpg') ||
      lower.includes('.jpeg') ||
      lower.includes('.png') ||
      lower.includes('.webp') ||
      lower.includes('format=') ||
      lower.includes('image')
    );
  }

  private cleanImageUrl(url: string): string {
    let clean = url.trim();
    // Decode HTML entities in url if any (e.g. &amp; -> &)
    clean = clean.replace(/&amp;/g, '&');

    // Upgrade BBC images from low-res thumbnails (/240/) to crisp high-res (/976/)
    if (clean.includes('ichef.bbci.co.uk')) {
      clean = clean.replace(/\/standard\/\d+\//i, '/standard/976/');
    }

    return clean;
  }

  private extractTag(xml: string, tag: string): string | null {
    // Check CDATA first: <tag><![CDATA[...]]></tag>
    const cdataRegex = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`, 'i');
    const cdataMatch = xml.match(cdataRegex);
    if (cdataMatch) {
      return cdataMatch[1].trim();
    }

    // Check standard tag: <tag>...</tag>
    const standardRegex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const standardMatch = xml.match(standardRegex);
    if (standardMatch) {
      return standardMatch[1].trim();
    }

    return null;
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private cleanHtmlEntities(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .trim();
  }

  private hashOrSlug(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }
}

export const rssCollector = new RssCollector();
