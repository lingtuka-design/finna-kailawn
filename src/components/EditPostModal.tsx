import React, { useState } from 'react';
import { X, Sparkles, Save, Clock, Image as ImageIcon, ExternalLink, BookOpen, PenTool, Calendar } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 sm:p-5 overflow-y-auto">
      {/* Solid Opaque Container */}
      <div className="bg-[#0f1118] border border-[#2a2f42] rounded-2xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl my-auto overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222738] bg-[#141722]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Edit & Polish Story
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Veilamah English original reference, dinglamah Mizo storytelling edit-na
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#1c2030] hover:bg-[#252b40] text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Column Split Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-[#0f1118]">
          
          {/* ======================================================== */}
          {/* LEFT COLUMN: ENGLISH SOURCE (VEILAMAH ENGLISH)           */}
          {/* ======================================================== */}
          <div className="flex flex-col space-y-4 bg-[#141722] border border-[#262c3e] rounded-xl p-5">
            <div className="flex items-center justify-between border-b border-[#252b3d] pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-slate-200 tracking-wide uppercase">
                  Original English Source
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-[#1f2537] text-blue-300 font-semibold text-xs border border-blue-500/20">
                  {post.source_id || post.source_type}
                </span>
                {post.original_url && (
                  <a
                    href={post.original_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    <span>Source</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Photo preview if available */}
            {imageUrl ? (
              <div className="relative rounded-lg overflow-hidden bg-black border border-[#2a2f42] aspect-video w-full max-h-56">
                <img
                  src={`/api/proxy-image?url=${encodeURIComponent(imageUrl)}`}
                  alt={post.original_title || 'Photo'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = imageUrl;
                  }}
                />
              </div>
            ) : null}

            {/* English Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                English Headline
              </label>
              <div className="bg-[#191d2c] border border-[#2a3045] rounded-lg p-3 text-sm sm:text-base font-bold text-white leading-snug">
                {post.original_title || 'No English Title'}
              </div>
            </div>

            {/* English Content / Explanation */}
            <div className="flex-1 flex flex-col">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Original Text / Facts Content
              </label>
              <div className="flex-1 bg-[#191d2c] border border-[#2a3045] rounded-lg p-4 text-sm sm:text-base text-slate-200 leading-relaxed font-sans overflow-y-auto max-h-[380px] whitespace-pre-line select-text">
                {post.original_text}
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: MIZO STORY EDIT (DINGLAMAH MIZO)           */}
          {/* ======================================================== */}
          <div className="flex flex-col space-y-4 bg-[#141722] border border-[#262c3e] rounded-xl p-5">
            <div className="flex items-center justify-between border-b border-[#252b3d] pb-3">
              <div className="flex items-center gap-2">
                <PenTool className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-bold text-white tracking-wide uppercase">
                  Mizo Story & Facebook Caption
                </span>
              </div>

              <span className="px-2.5 py-0.5 rounded-md bg-blue-500/15 text-blue-400 font-semibold text-xs border border-blue-500/30">
                Storyteller Mode
              </span>
            </div>

            {/* Gemini Rewrite Box */}
            <div className="bg-[#1a1f30] border border-blue-500/30 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-blue-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Gemini AI Storyteller Rewrite</span>
                </span>
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-60 shadow-sm"
                >
                  {isRegenerating ? 'Writing story...' : 'Regenerate Now'}
                </button>
              </div>
              <input
                type="text"
                placeholder="e.g. 'Sawi uar deuh rawh', 'A thilmak lai ber sawi hmasa rawh', 'Tlem a tawi zawk'"
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg text-sm bg-[#121522] border border-[#2d354d] text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Mizo Headline */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Mizo Headline
              </label>
              <input
                type="text"
                value={mizoTitle}
                onChange={(e) => setMizoTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm sm:text-base font-bold bg-[#191d2c] border border-[#2d354d] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Mizo Caption */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Mizo Caption (Post Text)
                </label>
                <span className="text-xs text-slate-400 font-mono">
                  {mizoCaption.length} characters
                </span>
              </div>
              <textarea
                rows={9}
                value={mizoCaption}
                onChange={(e) => setMizoCaption(e.target.value)}
                className="w-full flex-1 px-4 py-3 rounded-lg text-sm sm:text-base leading-relaxed bg-[#191d2c] border border-[#2d354d] text-slate-100 font-sans focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[220px]"
              />
            </div>

            {/* Schedule time & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span>Scheduled Time</span>
                </label>
                <input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-[#191d2c] border border-[#2d354d] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-[#191d2c] border border-[#2d354d] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="science">Science</option>
                  <option value="space">Space & Universe</option>
                  <option value="nature">Nature Wonders</option>
                  <option value="history">History</option>
                  <option value="general">General Facts</option>
                </select>
              </div>
            </div>

            {/* HD Image URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                <span>HD Photo URL</span>
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="w-full px-3.5 py-2 rounded-lg text-sm bg-[#191d2c] border border-[#2d354d] text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
              />
            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#222738] bg-[#141722]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-[#1f2537] transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-60 shadow-lg shadow-blue-600/30"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Updates...' : 'Save Updates'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
