export interface Post {
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

export interface PostCounts {
  total: number;
  queued: number;
  published: number;
  draft: number;
  failed: number;
}

export interface Source {
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

export interface SyncLog {
  id: number;
  action: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: string | null;
  items_count: number;
  created_at: string;
}

export interface SettingsState {
  settings: Record<string, string>;
  status: {
    hasGeminiKey: boolean;
    hasFbPageId: boolean;
    hasFbToken: boolean;
    hasCronSecret: boolean;
  };
}
