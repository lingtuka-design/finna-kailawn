import React, { useState } from 'react';
import { X, Sparkles, Send, Clock, Image as ImageIcon, Upload } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl my-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Create New Fact / Discovery</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <option value="space">Space & Universe</option>
                <option value="nature">Nature Wonders</option>
                <option value="history">History & Civilizations</option>
                <option value="general">General Facts</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Custom Schedule Time (Optional)
              </label>
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg text-xs bg-secondary border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Original Source English */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Original Fact Headline (English)
            </label>
            <input
              type="text"
              placeholder="e.g. Scientists discovered an ancient underground ocean..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg text-xs bg-secondary border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-muted-foreground">
                Original Explanation / Notes (English)
              </label>
              <button
                type="button"
                onClick={handleTranslateWithAi}
                disabled={isTranslating}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-60"
              >
                <Sparkles className={`w-3 h-3 ${isTranslating ? 'animate-spin' : ''}`} />
                <span>{isTranslating ? 'Storyteller writing...' : 'Write Mizo Story with Gemini'}</span>
              </button>
            </div>
            <textarea
              rows={3}
              placeholder="Paste raw research notes, article summary, or tweet here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-xs bg-secondary border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Mizo Output */}
          <div className="p-3.5 rounded-lg bg-secondary/40 border border-border/60 space-y-3">
            <div>
              <label className="block text-xs font-medium text-blue-400 mb-1">
                Mizo Story Headline
              </label>
              <input
                type="text"
                placeholder="e.g. Khawvel hnuai lama tuifinriat lian tak awm chu an hmuchhuak!"
                value={mizoTitle}
                onChange={(e) => setMizoTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg text-xs bg-card border border-border text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-blue-400 mb-1">
                Mizo Storytelling Caption (Facebook Post Text)
              </label>
              <textarea
                rows={5}
                placeholder="I lo hre ve tawh em? 🌍..."
                value={mizoCaption}
                onChange={(e) => setMizoCaption(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs bg-card border border-border text-foreground leading-relaxed focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Photo */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              HD Image URL or Upload
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://example.com/hd-photo.jpg"
                value={imageUrl.startsWith('data:') ? 'Image uploaded from device' : imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-secondary border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground border border-border cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {imageUrl && (
              <div className="mt-2 w-32 h-20 rounded-md overflow-hidden bg-black/40 border border-border">
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 p-4 border-t border-border bg-card/60">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSubmit('draft')}
              disabled={isSubmitting}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-colors disabled:opacity-60"
            >
              Save as Draft
            </button>

            <button
              type="button"
              onClick={() => handleSubmit('queued')}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-60 shadow-sm"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Add to Drip Queue</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
