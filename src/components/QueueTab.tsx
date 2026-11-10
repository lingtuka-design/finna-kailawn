import React, { useState } from 'react';
import { Send, Edit3, Trash2, Clock, Calendar, ExternalLink, Sparkles, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Post } from '../types';

interface QueueTabProps {
  posts: Post[];
  onPublishNow: (id: number) => Promise<void>;
  onEdit: (post: Post) => void;
  onDelete: (id: number) => Promise<void>;
  onSync: () => void;
}

export const QueueTab: React.FC<QueueTabProps> = ({
  posts,
  onPublishNow,
  onEdit,
  onDelete,
  onSync,
}) => {
  const [publishingId, setPublishingId] = useState<number | null>(null);

  const handlePublish = async (id: number) => {
    if (!window.confirm('Are you sure you want to publish this fact directly to Facebook right now?')) return;
    setPublishingId(id);
    try {
      await onPublishNow(id);
    } finally {
      setPublishingId(null);
    }
  };

  const formatScheduleTime = (timeStr?: string | null) => {
    if (!timeStr) return 'Unscheduled';
    const date = new Date(timeStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));

    const timeFormatted = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateFormatted = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

    if (diffMs <= 0) {
      return (
        <span className="text-amber-400 font-semibold flex items-center gap-1">
          <Clock className="w-3 h-3 animate-spin" /> Due Now ({timeFormatted})
        </span>
      );
    }

    let relative = diffHours <= 1 ? 'in < 1 hour' : `in ~${diffHours} hours`;

    return (
      <span className="text-blue-400 font-medium flex items-center gap-1">
        <Calendar className="w-3 h-3" /> {dateFormatted}, {timeFormatted} ({relative})
      </span>
    );
  };

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-secondary/80 border border-border flex items-center justify-center text-muted-foreground mb-4">
          <Clock className="w-7 h-7" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">Queue is Empty</h3>
        <p className="text-xs text-muted-foreground max-w-sm mb-5">
          No posts are currently waiting in the drip queue. Sync fresh content from LiveScience, NASA, and Twitter, or write a custom post.
        </p>
        <button
          onClick={onSync}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          <span>Sync Sources Now</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span>Upcoming Scheduled Facts</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-xs">
              {posts.length} queued
            </span>
          </h2>
          <p className="text-xs text-muted-foreground">
            The automated scheduler drips posts directly to your Facebook page at configured intervals.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {posts.map((post, idx) => (
          <div
            key={post.id}
            className="rounded-xl border border-border bg-card p-4 sm:p-5 transition-all hover:border-border/80 shadow-sm"
          >
            <div className="flex flex-col md:flex-row gap-4">
              {/* Photo preview */}
              <div className="w-full md:w-56 shrink-0">
                {post.image_url ? (
                  <div className="relative aspect-video md:aspect-[4/3] rounded-lg overflow-hidden bg-black/40 border border-border/60 group">
                    <img
                      src={`/api/proxy-image?url=${encodeURIComponent(post.image_url)}`}
                      alt={post.mizo_title || 'Post image'}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                      onError={(e) => {
                        // Fallback directly to raw URL if proxy fails
                        (e.target as HTMLImageElement).src = post.image_url!;
                      }}
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur text-[10px] text-white font-medium">
                      #{idx + 1} in queue
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video md:aspect-[4/3] rounded-lg bg-secondary/50 border border-dashed border-border/80 flex flex-col items-center justify-center text-muted-foreground text-xs p-3 text-center">
                    <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                    <span>No photo (text post)</span>
                  </div>
                )}
              </div>

              {/* Content Details */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-secondary text-foreground text-[11px] font-medium border border-border uppercase">
                        {post.category || 'Facts'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Source: <span className="font-medium text-foreground">{post.source_id || post.source_type}</span>
                      </span>
                    </div>

                    <div className="text-xs">
                      {formatScheduleTime(post.scheduled_for)}
                    </div>
                  </div>

                  {/* Title & Caption */}
                  <h3 className="text-sm font-semibold text-foreground mb-2 line-clamp-2">
                    {post.mizo_title || post.original_title || 'Untitled Fact'}
                  </h3>

                  <div className="bg-secondary/40 rounded-lg p-3 border border-border/40 text-xs text-foreground/90 whitespace-pre-line leading-relaxed font-sans max-h-36 overflow-y-auto mb-3">
                    {post.mizo_caption || post.original_text}
                  </div>
                </div>

                {/* Card footer actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    {post.original_url && (
                      <a
                        href={post.original_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-blue-400 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Source Link</span>
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit(post)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-colors"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit & Retranslate</span>
                    </button>

                    <button
                      onClick={() => onDelete(post.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-colors"
                      title="Remove from queue"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() => handlePublish(post.id)}
                      disabled={publishingId === post.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors disabled:opacity-60"
                    >
                      <Send className={`w-3 h-3 ${publishingId === post.id ? 'animate-pulse' : ''}`} />
                      <span>{publishingId === post.id ? 'Publishing...' : 'Publish Now'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
