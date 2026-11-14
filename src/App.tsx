import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { QueueTab } from './components/QueueTab';
import { DiscoverTab } from './components/DiscoverTab';
import { PublishedTab } from './components/PublishedTab';
import { SourcesTab } from './components/SourcesTab';
import { SettingsTab } from './components/SettingsTab';
import { LogsTab } from './components/LogsTab';
import { CreatePostModal } from './components/CreatePostModal';
import { EditPostModal } from './components/EditPostModal';
import { Post, PostCounts, Source, SyncLog, SettingsState } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('queue');
  const [posts, setPosts] = useState<Post[]>([]);
  const [counts, setCounts] = useState<PostCounts>({ total: 0, queued: 0, published: 0, draft: 0, failed: 0 });
  const [sources, setSources] = useState<Source[]>([]);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [settingsState, setSettingsState] = useState<SettingsState>({
    settings: {},
    status: { hasGeminiKey: false, hasFbPageId: false, hasFbToken: false, hasCronSecret: false },
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Fetch posts for active status or view
  const fetchPosts = useCallback(async () => {
    try {
      let url = '/api/posts';
      if (activeTab === 'queue') {
        url += '?status=queued';
      } else if (activeTab === 'published') {
        url += '?status=published';
      } else if (activeTab === 'discover') {
        url += '?status=draft';
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json() as any;
        if (data.posts) setPosts(data.posts);
        if (data.counts) setCounts(data.counts);
      }
    } catch (err: any) {
      console.error('Error fetching posts:', err);
    }
  }, [activeTab]);

  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch('/api/sources');
      if (res.ok) {
        const data = await res.json() as any;
        if (data.sources) setSources(data.sources);
      }
    } catch (err: any) {
      console.error('Error fetching sources:', err);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json() as any;
        setSettingsState({
          settings: data.settings || {},
          status: data.status || { hasGeminiKey: false, hasFbPageId: false, hasFbToken: false, hasCronSecret: false },
        });
      }
    } catch (err: any) {
      console.error('Error fetching settings:', err);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/logs?limit=40');
      if (res.ok) {
        const data = await res.json() as any;
        if (data.logs) setLogs(data.logs);
      }
    } catch (err: any) {
      console.error('Error fetching logs:', err);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchPosts(), fetchSources(), fetchSettings(), fetchLogs()]).finally(() => {
      setIsLoading(false);
    });
  }, [fetchPosts, fetchSources, fetchSettings, fetchLogs]);

  // Sync sources
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync?mode=all', { method: 'POST' });
      const data = await res.json() as any;
      if (res.ok && data.success) {
        notify(`Sync complete: ${data.sync?.newItems || 0} fresh items added!`);
        await Promise.all([fetchPosts(), fetchLogs()]);
      } else {
        notify(data.error || 'Sync encountered an error', 'error');
      }
    } catch (err: any) {
      notify('Failed to connect to sync endpoint: ' + err.message, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Publish post immediately
  const handlePublishNow = async (id: number) => {
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: id }),
      });
      const data = await res.json() as any;
      if (res.ok && data.success) {
        notify('Post successfully published to Facebook Page!');
        await Promise.all([fetchPosts(), fetchLogs()]);
      } else {
        notify(data.error || 'Failed to publish post to Facebook', 'error');
      }
    } catch (err: any) {
      notify('Publish network error: ' + err.message, 'error');
    }
  };

  // Translate and queue a discovery item
  const handleTranslateAndQueue = async (post: Post) => {
    try {
      // 1. Call translation
      const transRes = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.id,
          title: post.original_title,
          text: post.original_text,
          category: post.category,
        }),
      });

      const transData = await transRes.json() as any;
      if (!transRes.ok || !transData.success) {
        throw new Error(transData.error || 'Translation failed');
      }

      // 2. Put status to queued
      const updateRes = await fetch('/api/posts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: post.id,
          status: 'queued',
          mizoTitle: transData.mizoTitle,
          mizoCaption: transData.mizoCaption,
        }),
      });

      if (updateRes.ok) {
        notify('Story translated and added to Drip Queue!');
        await Promise.all([fetchPosts(), fetchLogs()]);
      }
    } catch (err: any) {
      notify(err.message, 'error');
    }
  };

  // Delete post
  const handleDeletePost = async (id: number) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      const res = await fetch(`/api/posts?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        notify('Post deleted');
        await fetchPosts();
      }
    } catch (err: any) {
      notify('Delete failed: ' + err.message, 'error');
    }
  };

  // Save updated post
  const handleSavePost = async (id: number, updates: Partial<Post>) => {
    try {
      const res = await fetch('/api/posts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          mizoTitle: updates.mizo_title,
          mizoCaption: updates.mizo_caption,
          imageUrl: updates.image_url,
          category: updates.category,
          scheduledFor: updates.scheduled_for,
          status: updates.status,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as any;
      if (res.ok && data.success) {
        notify('Post updated successfully');
        await fetchPosts();
      } else {
        notify('Save failed: ' + (data.error || 'Server error'), 'error');
      }
    } catch (err: any) {
      notify('Save failed: ' + err.message, 'error');
    }
  };

  // Create new post
  const handleCreatePost = async (postData: any) => {
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });
      const data = await res.json() as any;
      if (res.ok && data.success) {
        if (postData.publishImmediately && data.id) {
          await handlePublishNow(data.id);
        } else {
          notify('New post saved successfully');
        }
        await fetchPosts();
      }
    } catch (err: any) {
      notify('Create failed: ' + err.message, 'error');
    }
  };

  // Regenerate translation with custom prompt
  const handleRegenerate = async (postId: number, customInstruction: string) => {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, customInstruction }),
    });
    const data = await res.json() as any;
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Regeneration failed');
    }
    return { mizoTitle: data.mizoTitle, mizoCaption: data.mizoCaption };
  };

  // Translate standalone draft in Create modal
  const handleTranslateDraft = async (title: string, text: string, category: string) => {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, text, category }),
    });
    const data = await res.json() as any;
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Translation failed');
    }
    return { mizoTitle: data.mizoTitle, mizoCaption: data.mizoCaption };
  };

  // Toggle source
  const handleToggleSource = async (id: string, enabled: boolean) => {
    try {
      const res = await fetch('/api/sources', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enabled }),
      });
      if (res.ok) {
        setSources((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: enabled ? 1 : 0 } : s)));
        notify(`Source ${enabled ? 'enabled' : 'disabled'}`);
      }
    } catch (err: any) {
      notify('Toggle failed: ' + err.message, 'error');
    }
  };

  // Add source
  const handleAddSource = async (source: Partial<Source>) => {
    try {
      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(source),
      });
      if (res.ok) {
        notify('Source added successfully');
        await fetchSources();
      }
    } catch (err: any) {
      notify('Add source failed: ' + err.message, 'error');
    }
  };

  // Save settings
  const handleSaveSettings = async (newSettings: Record<string, string>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: newSettings }),
      });
      if (res.ok) {
        notify('Settings saved');
        await fetchSettings();
      }
    } catch (err: any) {
      notify('Save settings failed: ' + err.message, 'error');
    }
  };

  // Clear logs
  const handleClearLogs = async () => {
    if (!window.confirm('Clear all activity logs?')) return;
    try {
      const res = await fetch('/api/logs', { method: 'DELETE' });
      if (res.ok) {
        setLogs([]);
        notify('Logs cleared');
      }
    } catch (err: any) {
      notify('Clear failed: ' + err.message, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-blue-600/30">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-lg text-xs font-medium shadow-xl border transition-all ${
            notification.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-800'
              : 'bg-emerald-950/90 text-emerald-200 border-emerald-800'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        counts={counts}
        isSyncing={isSyncing}
        onSync={handleSync}
        onOpenCreate={() => setShowCreateModal(true)}
      />

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'queue' && (
          <QueueTab
            posts={posts}
            onPublishNow={handlePublishNow}
            onEdit={(p) => setEditingPost(p)}
            onDelete={handleDeletePost}
            onSync={handleSync}
          />
        )}

        {activeTab === 'discover' && (
          <DiscoverTab
            posts={posts}
            onTranslateAndQueue={handleTranslateAndQueue}
            onDelete={handleDeletePost}
            onSync={handleSync}
            isSyncing={isSyncing}
          />
        )}

        {activeTab === 'published' && <PublishedTab posts={posts} />}

        {activeTab === 'sources' && (
          <SourcesTab
            sources={sources}
            onToggleSource={handleToggleSource}
            onAddSource={handleAddSource}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            settingsState={settingsState}
            onSaveSettings={handleSaveSettings}
          />
        )}

        {activeTab === 'logs' && (
          <LogsTab
            logs={logs}
            onRefresh={fetchLogs}
            onClear={handleClearLogs}
          />
        )}
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePost}
          onTranslateDraft={handleTranslateDraft}
        />
      )}

      {/* Edit Modal */}
      {editingPost && (
        <EditPostModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onSave={handleSavePost}
          onRegenerate={handleRegenerate}
        />
      )}
    </div>
  );
};
export default App;
