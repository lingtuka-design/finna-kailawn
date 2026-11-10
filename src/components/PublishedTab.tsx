import React, { useState } from 'react';
import { ExternalLink, CheckCircle2, Search, Calendar, Image as ImageIcon } from 'lucide-react';
import { Post } from '../types';

interface PublishedTabProps {
  posts: Post[];
}

export const PublishedTab: React.FC<PublishedTabProps> = ({ posts }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = posts.filter((p) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      (p.mizo_title && p.mizo_title.toLowerCase().includes(s)) ||
      (p.mizo_caption && p.mizo_caption.toLowerCase().includes(s)) ||
      (p.original_title && p.original_title.toLowerCase().includes(s))
    );
  });

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span>Published Facebook Posts</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
              {posts.length} published
            </span>
          </h2>
          <p className="text-xs text-muted-foreground">
            History of facts successfully published to your Facebook Page.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search published posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-border bg-card p-6">
          <CheckCircle2 className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-60" />
          <h3 className="text-sm font-medium text-foreground mb-1">No Published Posts Found</h3>
          <p className="text-xs text-muted-foreground">
            {searchTerm ? 'No results matched your search query.' : 'Posts will appear here as they are published by the scheduler.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((post) => {
            const pubDate = post.published_at ? new Date(post.published_at) : null;
            const formattedDate = pubDate
              ? `${pubDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at ${pubDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Recently published';

            return (
              <div
                key={post.id}
                className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row gap-4 hover:border-border/80 transition-all shadow-sm"
              >
                {post.image_url ? (
                  <div className="w-full sm:w-36 h-28 shrink-0 rounded-lg overflow-hidden bg-black/40 border border-border/50">
                    <img
                      src={`/api/proxy-image?url=${encodeURIComponent(post.image_url)}`}
                      alt={post.mizo_title || 'Post image'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = post.image_url!;
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full sm:w-36 h-28 shrink-0 rounded-lg bg-secondary/50 border border-dashed border-border/60 flex items-center justify-center text-muted-foreground text-xs">
                    <ImageIcon className="w-5 h-5 opacity-40" />
                  </div>
                )}

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                      <span className="flex items-center gap-1 text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Published
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formattedDate}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-foreground mb-1.5 line-clamp-1">
                      {post.mizo_title || post.original_title}
                    </h3>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {post.mizo_caption || post.original_text}
                    </p>
                  </div>

                  <div className="pt-2 mt-2 border-t border-border/40 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-muted-foreground">
                      FB Post ID: <code className="text-foreground">{post.fb_post_id || 'Direct'}</code>
                    </span>

                    {post.fb_post_id && (
                      <a
                        href={`https://facebook.com/${post.fb_post_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium text-xs transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>View on Facebook</span>
                      </a>
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
