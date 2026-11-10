# Khawvel Xtra 🌍

**Khawvel Xtra** is an automated content curation, Mizo storytelling, review, and publishing platform for a Mizo Facebook page focusing on global facts, science, nature wonders, history, and space discoveries.

Deployed independently on **Cloudflare Pages** (with **Cloudflare D1 Database** and **Scheduled Cron Worker**).

---

## 🚀 Key Features

1. **Multi-Source Content Collector**:
   - **LiveScience RSS** (`https://www.livescience.com/feeds/all`)
   - **ScienceAlert RSS** (`https://www.sciencealert.com/feed`)
   - **BBC Science & Nature RSS** (`https://feeds.bbci.co.uk/news/science_and_environment/rss.xml`)
   - **NASA APOD API** (`https://api.nasa.gov/planetary/apod`)
   - **Twitter / X Accounts** (`@fasc1nate`, `@Rainmaker1973`, `@HistoryInPics`) via guest scraper
   - High-resolution original photo extraction (`?name=orig` / `<media:content>`).
   - Deduplication via unique source IDs.

2. **Gemini AI Mizo Storyteller**:
   - Uses Google Gemini API (`gemini-2.5-flash`, `gemini-1.5-flash`, `gemini-2.0-flash`).
   - Paraphrases and writes fluent, natural Mizo captions (avoiding stiff machine translation).
   - Catchy opening hooks ("I lo hre ve tawh em? 🌍", "Khawvel Thilmak:", "Hriatzauna:", "I hria em?").
   - Clean concluding hashtags (`#KhawvelXtra #Thilmak #Facts #Science`).
   - Strictly zero external links in captions for optimal Facebook organic algorithm reach.

3. **Drip Queue & Automated Scheduler**:
   - Queues posts with automated `scheduled_for` timestamps based on configurable intervals (e.g. every 3–4 hours: 09:00 AM, 01:00 PM, 05:00 PM, 09:00 PM).
   - Scheduled Cloudflare Worker runs 24/7 every minute, auto-publishing due posts to your Facebook Page via Meta Graph API with HD photos.

4. **Minimal Admin Review Dashboard**:
   - Mobile-first, minimal Shadcn aesthetic (`bg-background`, `border-border`, `text-foreground`).
   - Tabs:
     - **Drip Queue**: Upcoming scheduled posts with countdown, quick edit, and 1-click "Publish Now".
     - **Discover & Drafts**: Browse newly scraped facts and 1-click translate.
     - **Published Archive**: Searchable history of published Facebook posts with live Meta links.
     - **Sources**: Toggle and add custom RSS feeds or Twitter handles.
     - **Settings**: Configure Facebook Page credentials, Gemini API key, intervals, and hashtags.
     - **Logs**: Execution logs of syncs, AI translations, and publish events.

---

## 🛠️ Tech Stack

- **Frontend**: Vite + React 19 + TypeScript + Tailwind CSS v4 + Lucide Icons
- **Backend**: Cloudflare Pages Functions (`/functions/api/*`)
- **Database**: Cloudflare D1 (SQLite)
- **Cron Worker**: Cloudflare Scheduled Worker (`/worker/scheduled.ts`)
- **Deployment**: Cloudflare Pages (`wrangler pages deploy dist`)

---

## 📦 Setup & Deployment Instructions

### 1. Create Cloudflare D1 Database
Run this in your terminal:
```bash
npx wrangler d1 create khawvel-db
```
Copy the `database_id` output into `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "khawvel-db"
database_id = "<your-d1-database-id>"
```

### 2. Apply Database Migrations
For local testing:
```bash
npm run d1:migrate:local
```

For production Cloudflare D1:
```bash
npm run d1:migrate:prod
```

### 3. Configure Secrets
Set your API keys via Cloudflare CLI or in your Cloudflare Pages Dashboard:
```bash
# 1. Google AI Studio (Free Gemini API Key)
npx wrangler secret put GEMINI_API_KEY

# 2. Meta Facebook Graph API
npx wrangler secret put FB_PAGE_ID
npx wrangler secret put FB_PAGE_ACCESS_TOKEN

# 3. Optional Secret to protect CRON endpoint
npx wrangler secret put CRON_SECRET
```

### 4. Deploy Frontend & Pages Functions
```bash
npm run deploy
```

### 5. Deploy Scheduled Cron Worker (Optional 24/7 background scheduler)
```bash
cd worker
npx wrangler deploy
```

---

## 💻 Local Development
```bash
# Start local Vite dev server
npm run dev

# Start local Cloudflare Pages + D1 preview
npm run pages:dev
```
