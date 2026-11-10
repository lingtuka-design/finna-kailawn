import React, { useState } from 'react';
import { Sparkles, ExternalLink, Image as ImageIcon, CheckCircle, Clock, Trash2, Filter } from 'lucide-react';
import { Post } from '../types';

interface DiscoverTabProps {
  posts: Post[];
  onTranslateAndQueue: (post: Post) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onSync: () => void;
  isSyncing: boolean;
}

export const DiscoverTab: React.FC<DiscoverTabProps> = ({
  posts,
  onTranslateAndQueue,
  onDelete,
  onSync,
  isSyncing,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [translatingId, setTranslatingId] = useState<number | null>(null);

  const categories = [
    { id: 'all', label: 'All Items' },
    { id: 'science', label: 'Science' },
    { id: 'space', label: 'Space & NASA' },
    { id: 'nature', label: 'Nature' },
    { id: 'history', label: 'History' },
  ];

  const filteredPosts = posts.filter((p) => {
    if (selectedCategory === 'all') return true;
    return p.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  const handleTranslate = async (post: Post) => {
    setTranslatingId(post.id);
    try {
      await onTranslateAndQueue(post);
    } finally {
      setTranslatingId(null);
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Discovered Facts & Drafts
          </h2>
          <p className="text-xs text-muted-foreground">
            Curated from LiveScience, NASA, Twitter, and science journals.
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === c.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-border bg-card p-6">
          <p className="text-xs text-muted-foreground mb-4">
            No items found for the selected category.
          </p>
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fetch Fresh Items Now</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPosts.map((post) => {
            const isQueued = post.status === 'queued';
            const isPublished = post.status === 'published';

            return (
              <div
                key={post.id}
                className="rounded-xl border border-border bg-card p-4 flex flex-col justify-between hover:border-border/80 transition-all shadow-sm"
              >
                <div>
                  {/* Photo if present */}
                  {post.image_url ? (
                    <div className="aspect-video w-full rounded-lg overflow-hidden bg-black/40 border border-border/50 mb-3 relative">
                      <img
                        src={`/api/proxy-image?url=${encodeURIComponent(post.image_url)}`}
                        alt={post.original_title || 'Discovery photo'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = post.image_url!;
                        }}
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur text-[10px] text-white font-medium uppercase">
                        {post.category || 'Facts'}
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[3/1] w-full rounded-lg bg-secondary/40 border border-dashed border-border/60 flex items-center justify-center text-muted-foreground text-xs mb-3">
                      <ImageIcon className="w-4 h-4 mr-1 opacity-50" />
                      <span>Text Fact</span>
                    </div>
                  )}

                  {/* Header info */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Source: <strong className="text-foreground">{post.source_id}</strong></span>
                    {isPublished ? (
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Published
                      </span>
                    ) : isQueued ? (
                      <span className="text-blue-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Queued
                      </span>
                    ) : (
                      <span className="text-amber-400 font-medium">Draft</span>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-foreground mb-2 line-clamp-2">
                    {post.mizo_title || post.original_title}
                  </h3>

                  <p className="text-xs text-muted-foreground line-clamp-3 mb-3 leading-relaxed">
                    {post.mizo_caption || post.original_text}
                  </p>
                </div>

                {/* Footer buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs">
                  {post.original_url ? (
                    <a
                      href={post.original_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground hover:text-blue-400 flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Source
                    </a>
                  ) : <span />}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onDelete(post.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                      title="Discard item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {!isQueued && !isPublished && (
                      <button
                        onClick={() => handleTranslate(post)}
                        disabled={translatingId === post.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-60 shadow-sm"
                      >
                        <Sparkles className={`w-3 h-3 ${translatingId === post.id ? 'animate-spin' : ''}`} />
                        <span>{translatingId === post.id ? 'Storytelling...' : 'Translate & Queue'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
