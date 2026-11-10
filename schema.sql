-- Cloudflare D1 Database Schema for Finna Kailawn

CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,                -- 'rss', 'nasa', 'twitter', 'custom'
  url TEXT NOT NULL,                 -- RSS feed URL or Twitter screen name
  avatar_url TEXT,
  category TEXT DEFAULT 'science',   -- 'science', 'nature', 'history', 'space', 'general'
  enabled INTEGER DEFAULT 1,
  last_scraped_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id TEXT,
  source_type TEXT NOT NULL DEFAULT 'rss', -- 'rss', 'nasa', 'twitter', 'manual'
  external_id TEXT UNIQUE NOT NULL,       -- Guaranteed deduplication
  original_title TEXT,
  original_text TEXT NOT NULL,
  original_url TEXT,
  image_url TEXT,                         -- HD source image URL
  mizo_title TEXT,
  mizo_caption TEXT,                      -- Natural storytelling Mizo caption
  category TEXT DEFAULT 'facts',
  status TEXT DEFAULT 'draft',            -- 'draft', 'queued', 'published', 'failed', 'rejected'
  scheduled_for TEXT,                     -- Scheduled timestamp (ISO 8601)
  published_at TEXT,
  fb_post_id TEXT,                        -- Meta Graph API published ID
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sync_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,                   -- 'sync', 'translate', 'publish', 'cron'
  status TEXT NOT NULL,                   -- 'success', 'warning', 'error'
  message TEXT NOT NULL,
  details TEXT,
  items_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for lightning fast operations
CREATE INDEX IF NOT EXISTS idx_posts_external_id ON posts (external_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts (status);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_for ON posts (scheduled_for);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON sync_logs (created_at DESC);

-- Seed Initial Default Sources
INSERT OR IGNORE INTO sources (id, name, type, url, avatar_url, category, enabled) VALUES
('livescience', 'LiveScience', 'rss', 'https://www.livescience.com/feeds/all', 'https://cdn.mos.cms.futurecdn.net/76W8Jz6x72rJk5rPzU4N4D.png', 'science', 1),
('sciencealert', 'ScienceAlert', 'rss', 'https://www.sciencealert.com/feed', 'https://www.sciencealert.com/images/favicon.ico', 'science', 1),
('bbc_science', 'BBC Science & Nature', 'rss', 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml', 'https://news.bbcimg.co.uk/nol/shared/img/bbc_news_120x60.gif', 'nature', 1),
('nasa_apod', 'NASA APOD (Picture of the Day)', 'nasa', 'https://api.nasa.gov/planetary/apod', 'https://science.nasa.gov/wp-content/themes/nasa-child/assets/images/nasa-logo@2x.png', 'space', 0),
('twitter_fasc1nate', 'fasc1nate (@fasc1nate)', 'twitter', 'fasc1nate', 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png', 'history', 1),
('twitter_Rainmaker1973', 'Massimo (@Rainmaker1973)', 'twitter', 'Rainmaker1973', 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png', 'science', 1),
('twitter_HistoryInPics', 'History In Pictures (@HistoryInPics)', 'twitter', 'HistoryInPics', 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png', 'history', 1);

-- Seed Default Settings
INSERT OR IGNORE INTO settings (key, value) VALUES
('auto_publish_enabled', 'true'),
('auto_translate_on_sync', 'true'),
('drip_schedule_times', '08:00,11:00,14:00,17:00,20:00,23:00'),
('drip_interval_hours', '3'),
('post_hashtags', '#FinnaKailawn #Thilmak #Facts #Science #Discoveries #History'),
('system_timezone', 'Asia/Kolkata');
