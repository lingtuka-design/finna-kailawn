export interface Env {
  DB: D1Database;
  GEMINI_API_KEY?: string;
  GEMINI_API_KEY_2?: string;
  GEMINI_API_KEY_FALLBACK?: string;
  FB_PAGE_ID?: string;
  FB_PAGE_ACCESS_TOKEN?: string;
  CRON_SECRET?: string;
  NASA_API_KEY?: string;
  ADMIN_PIN?: string;
  SITE_NAME?: string;
  TIMEZONE?: string;
  DEFAULT_INTERVAL_HOURS?: string;
  SCHEDULE_HOURS?: string;
}

export interface SourceRecord {
  id: string;
  name: string;
  type: 'rss' | 'nasa' | 'twitter' | 'custom';
  url: string;
  avatar_url?: string | null;
  category: 'science' | 'nature' | 'history' | 'space' | 'general';
  enabled: number;
  last_scraped_at?: string | null;
  created_at: string;
}

export interface PostRecord {
  id: number;
  source_id?: string | null;
  source_type: 'rss' | 'nasa' | 'twitter' | 'manual';
  external_id: string;
  original_title?: string | null;
  original_text: string;
  original_url?: string | null;
  image_url?: string | null;
  mizo_title?: string | null;
  mizo_caption?: string | null;
  category: string;
  status: 'draft' | 'queued' | 'published' | 'failed' | 'rejected';
  scheduled_for?: string | null;
  published_at?: string | null;
  fb_post_id?: string | null;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SyncLogRecord {
  id: number;
  action: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: string | null;
  items_count: number;
  created_at: string;
}

export interface CollectedItem {
  sourceId: string;
  sourceType: 'rss' | 'nasa' | 'twitter' | 'manual';
  externalId: string;
  title: string;
  text: string;
  url: string;
  imageUrl?: string;
  category: 'science' | 'nature' | 'history' | 'space' | 'general';
  publishedAt?: string;
}

export interface StorytellerResult {
  mizoTitle?: string;
  mizoCaption: string;
}
