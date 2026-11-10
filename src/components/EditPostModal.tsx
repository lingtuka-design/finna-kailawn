import React, { useState } from 'react';
import { X, Sparkles, Save, Clock, Image as ImageIcon } from 'lucide-react';
import { Post } from '../types';

interface EditPostModalProps {
  post: Post;
  onClose: () => void;
  onSave: (id: number, updates: Partial<Post>) => Promise<void>;
  onRegenerate: (postId: number, customInstruction: string) => Promise<{ mizoTitle?: string; mizoCaption: string }>;
}

export const EditPostModal: React.FC<EditPostModalProps> = ({
  post,
  onClose,
  onSave,
  onRegenerate,
}) => {
  const [mizoTitle, setMizoTitle] = useState(post.mizo_title || post.original_title || '');
  const [mizoCaption, setMizoCaption] = useState(post.mizo_caption || post.original_text || '');
  const [imageUrl, setImageUrl] = useState(post.image_url || '');
  const [category, setCategory] = useState(post.category || 'science');
  const [scheduledFor, setScheduledFor] = useState(
    post.scheduled_for ? new Date(post.scheduled_for).toISOString().slice(0, 16) : ''
  );

  const [customInstruction, setCustomInstruction] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const res = await onRegenerate(post.id, customInstruction);
      if (res.mizoTitle) setMizoTitle(res.mizoTitle);
      if (res.mizoCaption) setMizoCaption(res.mizoCaption);
    } catch (err: any) {
      alert('Regeneration error: ' + err.message);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(post.id, {
        mizo_title: mizoTitle,
        mizo_caption: mizoCaption,
        image_url: imageUrl || null,
        category,
        scheduled_for: scheduledFor ? new Date(scheduledFor).toISOString() : null,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl my-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Edit & Polish Story</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Original Source Reference */}
          <div className="p-3 rounded-lg bg-secondary/50 border border-border/50 text-xs">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Original English Reference ({post.source_id})
            </span>
            <p className="text-foreground font-medium mb-1">{post.original_title}</p>
            <p className="text-muted-foreground line-clamp-3 leading-relaxed">{post.original_text}</p>
          </div>

          {/* AI Storyteller prompt enhancement */}
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Rewrite with Gemini AI</span>
              </span>
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="px-2.5 py-1 rounded-md text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-60"
              >
                {isRegenerating ? 'Rewriting...' : 'Regenerate Now'}
              </button>
            </div>
            <input
              type="text"
              placeholder="e.g. 'Make it more mysterious', 'Focus on the scientific discovery', 'Shorter hook'"
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              className="w-full px-3 py-1.5 rounded-md text-xs bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Mizo Headline
            </label>
            <input
              type="text"
              value={mizoTitle}
              onChange={(e) => setMizoTitle(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg text-xs bg-secondary border border-border text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Mizo Facebook Story Caption
            </label>
            <textarea
              rows={7}
              value={mizoCaption}
              onChange={(e) => setMizoCaption(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-xs bg-secondary border border-border text-foreground leading-relaxed focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Scheduled Time
              </label>
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg text-xs bg-secondary border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg text-xs bg-secondary border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="science">Science</option>
                <option value="space">Space</option>
                <option value="nature">Nature Wonders</option>
                <option value="history">History</option>
                <option value="general">General Facts</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              HD Image URL
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg text-xs bg-secondary border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-border bg-card/60">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-60 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Updates'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
