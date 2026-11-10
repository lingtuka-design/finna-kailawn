import React, { useState } from 'react';
import { Save, CheckCircle2, Shield, Key, Clock, HelpCircle, AlertCircle } from 'lucide-react';
import { SettingsState } from '../types';

interface SettingsTabProps {
  settingsState: SettingsState;
  onSaveSettings: (settings: Record<string, string>) => Promise<void>;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settingsState,
  onSaveSettings,
}) => {
  const [form, setForm] = useState<Record<string, string>>({
    auto_publish_enabled: settingsState.settings.auto_publish_enabled ?? 'true',
    auto_translate_on_sync: settingsState.settings.auto_translate_on_sync ?? 'true',
    drip_interval_hours: settingsState.settings.drip_interval_hours ?? '4',
    drip_schedule_times: settingsState.settings.drip_schedule_times ?? '09:00,13:00,17:00,21:00',
    post_hashtags: settingsState.settings.post_hashtags ?? '#KhawvelXtra #Thilmak #Facts #Science #Discoveries #History',
    gemini_api_key: settingsState.settings.gemini_api_key ?? '',
    fb_page_id: settingsState.settings.fb_page_id ?? '',
    fb_access_token: settingsState.settings.fb_access_token ?? '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onSaveSettings(form);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-12 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            System & Publishing Settings
          </h2>
          <p className="text-xs text-muted-foreground">
            Configure automated drip schedules, Facebook credentials, and Gemini AI storytelling.
          </p>
        </div>

        {saveSuccess && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
            <CheckCircle2 className="w-4 h-4" /> Settings saved!
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Automation switches */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            <span>Drip Scheduler & Automation</span>
          </h3>

          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <div>
              <label className="text-xs font-medium text-foreground block">
                Auto-Publish to Facebook
              </label>
              <p className="text-[11px] text-muted-foreground">
                When active, the scheduled cron checks every minute and publishes due posts automatically.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  auto_publish_enabled: prev.auto_publish_enabled === 'true' ? 'false' : 'true',
                }))
              }
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                form.auto_publish_enabled === 'true' ? 'bg-blue-600' : 'bg-muted'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  form.auto_publish_enabled === 'true' ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <div>
              <label className="text-xs font-medium text-foreground block">
                Auto-Translate with Gemini on Sync
              </label>
              <p className="text-[11px] text-muted-foreground">
                Automatically transform newly discovered facts into fluent Mizo stories and add them to the queue.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  auto_translate_on_sync: prev.auto_translate_on_sync === 'true' ? 'false' : 'true',
                }))
              }
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                form.auto_translate_on_sync === 'true' ? 'bg-blue-600' : 'bg-muted'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  form.auto_translate_on_sync === 'true' ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Drip Interval (Hours between posts)
              </label>
              <select
                value={form.drip_interval_hours}
                onChange={(e) => setForm((prev) => ({ ...prev, drip_interval_hours: e.target.value }))}
                className="w-full px-3 py-1.5 rounded-lg text-xs bg-secondary border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="2">Every 2 Hours (Fast Drip)</option>
                <option value="3">Every 3 Hours</option>
                <option value="4">Every 4 Hours (Recommended)</option>
                <option value="6">Every 6 Hours</option>
                <option value="8">Every 8 Hours</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Fixed Daily Slots (IST)
              </label>
              <input
                type="text"
                value={form.drip_schedule_times}
                onChange={(e) => setForm((prev) => ({ ...prev, drip_schedule_times: e.target.value }))}
                placeholder="09:00,13:00,17:00,21:00"
                className="w-full px-3 py-1.5 rounded-lg text-xs bg-secondary border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Standard Hashtags
            </label>
            <input
              type="text"
              value={form.post_hashtags}
              onChange={(e) => setForm((prev) => ({ ...prev, post_hashtags: e.target.value }))}
              className="w-full px-3 py-1.5 rounded-lg text-xs bg-secondary border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-[11px]"
            />
          </div>
        </div>

        {/* API Credentials */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Key className="w-3.5 h-3.5" />
            <span>API Credentials & Access</span>
          </h3>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-foreground">
                Google Gemini API Key
              </label>
              {settingsState.status.hasGeminiKey && (
                <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Active
                </span>
              )}
            </div>
            <input
              type="password"
              placeholder={settingsState.status.hasGeminiKey ? '••••••••••••••••••••••••' : 'AIzaSy...'}
              value={form.gemini_api_key}
              onChange={(e) => setForm((prev) => ({ ...prev, gemini_api_key: e.target.value }))}
              className="w-full px-3 py-1.5 rounded-lg text-xs bg-secondary border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Get a free API key from Google AI Studio (aistudio.google.com).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-foreground">
                  Facebook Page ID
                </label>
                {settingsState.status.hasFbPageId && (
                  <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Configured
                  </span>
                )}
              </div>
              <input
                type="text"
                placeholder="e.g. 1000892348234"
                value={form.fb_page_id}
                onChange={(e) => setForm((prev) => ({ ...prev, fb_page_id: e.target.value }))}
                className="w-full px-3 py-1.5 rounded-lg text-xs bg-secondary border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-foreground">
                  Facebook Page Access Token
                </label>
                {settingsState.status.hasFbToken && (
                  <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Configured
                  </span>
                )}
              </div>
              <input
                type="password"
                placeholder={settingsState.status.hasFbToken ? '••••••••••••••••••••••••' : 'EAABw...'}
                value={form.fb_access_token}
                onChange={(e) => setForm((prev) => ({ ...prev, fb_access_token: e.target.value }))}
                className="w-full px-3 py-1.5 rounded-lg text-xs bg-secondary border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-sm disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
