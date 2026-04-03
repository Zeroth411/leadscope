import { useState, useEffect, useCallback } from 'react';
import { Clock, Trash2, Loader2, AlertCircle, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import ConfigError from '../components/ConfigError';

interface SearchEntry {
  id: number;
  query: string;
  results_count: number;
  no_website_filter: boolean;
  created_at: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<SearchEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [configError, setConfigError] = useState('');

  const fetchHistory = useCallback(async () => {
    try {
      setConfigError('');
      const res = await fetch('/api/history');
      const data = await res.json();
      if (res.status === 503) {
        setConfigError(data.error || 'Missing server configuration');
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Failed to load history');
      if (Array.isArray(data)) setHistory(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleDelete = useCallback(async (id: number) => {
    setDeletingId(id);
    try {
      await fetch('/api/history', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      await fetchHistory();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeletingId(null);
    }
  }, [fetchHistory]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="skeleton h-7 w-40 rounded mb-4" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-3"><div className="skeleton h-5 w-48 rounded" /><div className="skeleton h-5 w-20 rounded" /></div>
              <div className="skeleton h-5 w-16 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (configError) {
    return <ConfigError message={configError} onRetry={fetchHistory} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-accent" />
        <h2 className="text-base font-semibold text-text-primary">Search History</h2>
        <span className="text-xs text-text-muted bg-bg-elevated px-2 py-0.5 rounded-full">{history.length}</span>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-danger/20 bg-danger-bg">
          <AlertCircle className="h-5 w-5 text-danger flex-shrink-0" />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {history.length === 0 && !error ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/5 border border-accent/10 mb-4">
            <Clock className="h-7 w-7 text-accent/40" />
          </div>
          <h3 className="text-base font-semibold text-text-primary mb-1">No search history</h3>
          <p className="text-sm text-text-muted">Your searches will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((entry, i) => (
            <motion.div key={entry.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }} className="flex items-center justify-between p-4 rounded-xl border border-border bg-bg-card hover:bg-bg-hover/50 transition-colors group">
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent/5 border border-accent/10 flex items-center justify-center">
                  <Search className="h-4 w-4 text-accent/50" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{entry.query}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-text-muted">{entry.results_count} results</span>
                    {entry.no_website_filter && <span className="text-xs text-warn bg-warn-bg px-1.5 py-0.5 rounded">No website filter</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">{formatDate(entry.created_at)}</span>
                <button onClick={() => handleDelete(entry.id)} disabled={deletingId === entry.id} className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-bg transition-all opacity-0 group-hover:opacity-100 disabled:cursor-not-allowed" title="Delete">
                  {deletingId === entry.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
