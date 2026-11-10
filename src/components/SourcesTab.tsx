import React, { useState } from 'react';
import { Plus, Check, X as CloseIcon, Rss, Sparkles, Globe, Layers, AlertCircle } from 'lucide-react';
import { Source } from '../types';

interface SourcesTabProps {
  sources: Source[];
  onToggleSource: (id: string, enabled: boolean) => Promise<void>;
  onAddSource: (source: Partial<Source>) => Promise<void>;
}

export const SourcesTab: React.FC<SourcesTabProps> = ({
  sources,
  onToggleSource,
  onAddSource,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'rss' | 'twitter' | 'custom'>('rss');
  const [newUrl, setNewUrl] = useState('');
  const [newCategory, setNewCategory] = useState<'science' | 'nature' | 'history' | 'space' | 'general'>('science');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId || !newName || !newUrl) return;

    setIsSubmitting(true);
    try {
      await onAddSource({
        id: newId.trim().toLowerCase().replace(/\s+/g, '_'),
        name: newName.trim(),
        type: newType,
        url: newUrl.trim(),
        category: newCategory,
        enabled: 1,
      });
      setShowAddModal(false);
      setNewId('');
      setNewName('');
      setNewUrl('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'twitter':
        return (
          <svg className="w-3.5 h-3.5 text-foreground fill-current" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        );
      case 'nasa':
        return <Globe className="w-4 h-4 text-purple-400" />;
      case 'rss':
      default:
        return <Rss className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Curated Content Sources
          </h2>
          <p className="text-xs text-muted-foreground">
            Feeds, APIs, and Twitter channels that Khawvel Xtra monitors for high-quality facts.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Custom Source</span>
        </button>
      </div>

      <div className="grid gap-3">
        {sources.map((source) => (
          <div
            key={source.id}
            className={`rounded-xl border p-4 flex items-center justify-between transition-all ${
              source.enabled
                ? 'bg-card border-border hover:border-border/80'
                : 'bg-card/40 border-border/40 opacity-70'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0 border border-border">
                {getSourceIcon(source.type)}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-semibold text-foreground truncate">
                    {source.name}
                  </h3>
                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-secondary text-muted-foreground border border-border">
                    {source.category}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate max-w-md">
                  {source.type === 'twitter' ? `@${source.url}` : source.url}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                {source.last_scraped_at
                  ? `Checked ${new Date(source.last_scraped_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Never synced'}
              </span>

              {/* Toggle Switch */}
              <button
                onClick={() => onToggleSource(source.id, !source.enabled)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  source.enabled ? 'bg-blue-600' : 'bg-muted'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    source.enabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Source Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Add Custom Source</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Source Type
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-lg text-xs bg-secondary border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="rss">RSS / Atom Feed</option>
                  <option value="twitter">Twitter / X Account</option>
                  <option value="custom">Custom Web Scraper</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. National Geographic News"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    if (!newId) {
                      setNewId(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_'));
                    }
                  }}
                  className="w-full px-3 py-1.5 rounded-lg text-xs bg-secondary border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Source ID (Slug)
                </label>
                <input
                  type="text"
                  required
                  placeholder="natgeo_rss"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg text-xs bg-secondary border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  {newType === 'twitter' ? 'Twitter Screen Name (without @)' : 'Feed URL'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={newType === 'twitter' ? 'fasc1nate' : 'https://example.com/feed.xml'}
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg text-xs bg-secondary border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-lg text-xs bg-secondary border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="science">Science</option>
                  <option value="nature">Nature Wonders</option>
                  <option value="history">History</option>
                  <option value="space">Space</option>
                  <option value="general">General Facts</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-60"
                >
                  {isSubmitting ? 'Saving...' : 'Add Source'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
