import React, { useState } from 'react';
import { X, Sparkles, Send, Clock, Image as ImageIcon, Upload, PenTool, BookOpen } from 'lucide-react';

interface CreatePostModalProps {
  onClose: () => void;
  onSubmit: (postData: any) => Promise<void>;
  onTranslateDraft: (title: string, text: string, category: string) => Promise<{ mizoTitle?: string; mizoCaption: string }>;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  onClose,
  onSubmit,
  onTranslateDraft,
}) => {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [mizoTitle, setMizoTitle] = useState('');
  const [mizoCaption, setMizoCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('science');
  const [scheduledFor, setScheduledFor] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTranslateWithAi = async () => {
    if (!text && !title) {
      alert('Please enter at least an English title or facts first.');
      return;
    }
    setIsTranslating(true);
    try {
      const res = await onTranslateDraft(title, text, category);
      if (res.mizoTitle) setMizoTitle(res.mizoTitle);
      if (res.mizoCaption) setMizoCaption(res.mizoCaption);
    } catch (err: any) {
      alert('AI Storyteller error: ' + err.message);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (status: 'queued' | 'draft' | 'publish_now') => {
    if (!mizoCaption && !text) {
      alert('Please provide caption or text.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        text,
        mizoTitle,
        mizoCaption,
        imageUrl,
        category,
        status: status === 'publish_now' ? 'queued' : status,
        publishImmediately: status === 'publish_now',
        scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : undefined,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#0f1118] border border-[#2a2f42] rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl my-auto overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222738] bg-[#141722]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Create New Fact / Discovery Post
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Facts thar ziahna leh Gemini hmanga Mizo story-a siamna
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#1c2030] hover:bg-[#252b40] text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - 2 Columns */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-[#0f1118]">
          
          {/* Left Column: English Input */}
          <div className="flex flex-col space-y-4 bg-[#141722] border border-[#262c3e] rounded-xl p-5">
            <div className="flex items-center justify-between border-b border-[#252b3d] pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-white tracking-wide uppercase">
                  1. Source / English Information
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                English Headline / Fact Title
              </label>
              <input
                type="text"
                placeholder="e.g. Scientists discovered an ancient underground ocean..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm sm:text-base font-medium bg-[#191d2c] border border-[#2d354d] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Original Explanation / Fact Notes
                </label>
                <button
                  type="button"
                  onClick={handleTranslateWithAi}
                  disabled={isTranslating}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors disabled:opacity-60 shadow-sm"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isTranslating ? 'animate-spin' : ''}`} />
                  <span>{isTranslating ? 'Writing story...' : 'Translate to Mizo with Gemini'}</span>
                </button>
              </div>
              <textarea
                rows={8}
                placeholder="Paste raw research notes, article summary, or tweet here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full flex-1 px-4 py-3 rounded-lg text-sm sm:text-base leading-relaxed bg-[#191d2c] border border-[#2d354d] text-slate-100 font-sans focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[180px]"
              />
            </div>

            {/* Photo upload / URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-400" />
                <span>HD Image URL or Upload</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://example.com/hd-photo.jpg"
                  value={imageUrl.startsWith('data:') ? 'Image uploaded from device' : imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-lg text-sm bg-[#191d2c] border border-[#2d354d] text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                />
                <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-[#202538] hover:bg-[#2b324c] text-white border border-[#2d354d] cursor-pointer transition-colors shrink-0">
                  <Upload className="w-4 h-4" />
                  <span>Upload</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              {imageUrl && (
                <div className="mt-3 w-40 h-24 rounded-lg overflow-hidden bg-black border border-[#2a2f42]">
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Mizo Output */}
          <div className="flex flex-col space-y-4 bg-[#141722] border border-[#262c3e] rounded-xl p-5">
            <div className="flex items-center justify-between border-b border-[#252b3d] pb-3">
              <div className="flex items-center gap-2">
                <PenTool className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-bold text-white tracking-wide uppercase">
                  2. Mizo Storytelling (Facebook Caption)
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Mizo Story Headline
              </label>
              <input
                type="text"
                placeholder="e.g. Khawvel hnuai lama tuifinriat lian tak awm chu an hmuchhuak!"
                value={mizoTitle}
                onChange={(e) => setMizoTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm sm:text-base font-bold bg-[#191d2c] border border-[#2d354d] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex-1 flex flex-col">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Mizo Facebook Story Caption
              </label>
              <textarea
                rows={9}
                placeholder="I lo hre ve tawh em? 🌍..."
                value={mizoCaption}
                onChange={(e) => setMizoCaption(e.target.value)}
                className="w-full flex-1 px-4 py-3 rounded-lg text-sm sm:text-base leading-relaxed bg-[#191d2c] border border-[#2d354d] text-slate-100 font-sans focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[200px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
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
                  <option value="history">History & Civilizations</option>
                  <option value="general">General Facts</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Custom Schedule Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-[#191d2c] border border-[#2d354d] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-[#222738] bg-[#141722]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-[#1f2537] transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSubmit('draft')}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#202538] hover:bg-[#2b324c] text-white border border-[#2d354d] transition-colors disabled:opacity-60"
            >
              Save as Draft
            </button>

            <button
              type="button"
              onClick={() => handleSubmit('queued')}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-60 shadow-lg shadow-blue-600/30"
            >
              <Clock className="w-4 h-4" />
              <span>Add to Drip Queue</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
