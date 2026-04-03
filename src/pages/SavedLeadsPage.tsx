import { useState, useEffect, useCallback } from 'react';
import { Bookmark, Trash2, Download, Loader2, Phone, Globe, AlertCircle, ExternalLink, ChevronDown, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfigError from '../components/ConfigError';

interface SavedLead {
  id: number;
  name: string;
  phone: string;
  address: string;
  website: string;
  status: string;
  score: number;
  lead_tier: string;
  call_status: string;
  notes: string;
  created_at: string;
}

const TIER_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  HOT_LEAD: { label: 'Hot', color: 'bg-hot-bg text-hot border border-hot/25', icon: '\ud83d\udd25' },
  GOOD_LEAD: { label: 'Good', color: 'bg-good-bg text-good border border-good/25', icon: '\u2705' },
  LOW_VALUE: { label: 'Low', color: 'bg-lowval-bg text-lowval border border-lowval/25', icon: '\u2b1c' },
};

const CALL_STATUS_OPTIONS = [
  { value: 'NOT_CALLED', label: 'Not Called', color: 'bg-lowval-bg text-lowval border-lowval/20' },
  { value: 'CALLED', label: 'Called', color: 'bg-called-bg text-called border-called/20' },
  { value: 'INTERESTED', label: 'Interested', color: 'bg-interested-bg text-interested border-interested/20' },
  { value: 'NOT_INTERESTED', label: 'Not Interested', color: 'bg-not-interested-bg text-not-interested border-not-interested/20' },
];

const CALL_FILTER_OPTIONS = [
  { value: 'ALL', label: 'All Leads' },
  { value: 'NOT_CALLED', label: 'Not Called' },
  { value: 'CALLED', label: 'Called' },
  { value: 'INTERESTED', label: 'Interested' },
  { value: 'NOT_INTERESTED', label: 'Not Interested' },
];

export default function SavedLeadsPage() {
  const [leads, setLeads] = useState<SavedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [configError, setConfigError] = useState('');
  const [callFilter, setCallFilter] = useState('ALL');
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');

  const fetchLeads = useCallback(async () => {
    try {
      setConfigError('');
      const params = new URLSearchParams();
      if (callFilter !== 'ALL') params.set('callStatus', callFilter);
      const res = await fetch(`/api/saved-leads?${params.toString()}`);
      const data = await res.json();
      if (res.status === 503) {
        setConfigError(data.error || 'Missing server configuration');
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Failed to load leads');
      if (Array.isArray(data)) setLeads(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load saved leads');
    } finally {
      setLoading(false);
    }
  }, [callFilter]);

  useEffect(() => { setLoading(true); fetchLeads(); }, [fetchLeads]);

  const handleDelete = useCallback(async (id: number) => {
    setDeletingId(id);
    try {
      await fetch('/api/saved-leads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      await fetchLeads();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeletingId(null);
    }
  }, [fetchLeads]);

  const handleUpdateCallStatus = useCallback(async (id: number, newStatus: string) => {
    setUpdatingId(id);
    try {
      await fetch('/api/saved-leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, call_status: newStatus }),
      });
      await fetchLeads();
    } catch (err) {
      console.error('Update failed:', err);
    } finally {
      setUpdatingId(null);
    }
  }, [fetchLeads]);

  const handleSaveNote = useCallback(async (id: number) => {
    setUpdatingId(id);
    try {
      await fetch('/api/saved-leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, notes: noteText }),
      });
      setEditingNoteId(null);
      setNoteText('');
      await fetchLeads();
    } catch (err) {
      console.error('Note save failed:', err);
    } finally {
      setUpdatingId(null);
    }
  }, [fetchLeads, noteText]);

  const handleExport = useCallback(() => {
    if (leads.length === 0) return;
    const headers = ['Name', 'Phone', 'Address', 'Status', 'Score', 'Lead Tier', 'Call Status', 'Notes'];
    const rows = leads.map(l => [
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${l.phone || ''}"`,
      `"${(l.address || '').replace(/"/g, '""')}"`,
      `"${l.status || ''}"`,
      `"${l.score || 0}"`,
      `"${l.lead_tier || ''}"`,
      `"${l.call_status || ''}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `crm_leads_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [leads]);

  const crmStats = {
    total: leads.length,
    notCalled: leads.filter(l => l.call_status === 'NOT_CALLED').length,
    called: leads.filter(l => l.call_status === 'CALLED').length,
    interested: leads.filter(l => l.call_status === 'INTERESTED').length,
    notInterested: leads.filter(l => l.call_status === 'NOT_INTERESTED').length,
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <div className="skeleton h-7 w-40 rounded" />
          <div className="skeleton h-9 w-28 rounded-lg" />
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-bg-card p-4">
            <div className="flex gap-4"><div className="skeleton h-10 w-10 rounded-lg" /><div className="skeleton h-5 w-40 rounded" /><div className="skeleton h-5 w-28 rounded" /><div className="skeleton h-5 w-56 rounded flex-1" /></div>
          </div>
        ))}
      </div>
    );
  }

  if (configError) {
    return <ConfigError message={configError} onRetry={fetchLeads} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-accent" />
          <h2 className="text-base font-semibold text-text-primary">Lead CRM</h2>
          <span className="text-xs text-text-muted bg-bg-elevated px-2 py-0.5 rounded-full">{leads.length} leads</span>
        </div>
        {leads.length > 0 && (
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-card border border-border text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-all">
            <Download className="h-4 w-4" /> Export CSV
          </button>
        )}
      </div>

      {leads.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="rounded-xl border border-border bg-bg-card p-3 text-center">
            <p className="text-xs text-text-muted mb-0.5">Total</p>
            <p className="text-xl font-bold text-text-primary">{crmStats.total}</p>
          </div>
          <div className="rounded-xl border border-lowval/15 bg-lowval-bg p-3 text-center">
            <p className="text-xs text-lowval/70 mb-0.5">Not Called</p>
            <p className="text-xl font-bold text-lowval">{crmStats.notCalled}</p>
          </div>
          <div className="rounded-xl border border-called/15 bg-called-bg p-3 text-center">
            <p className="text-xs text-called/70 mb-0.5">Called</p>
            <p className="text-xl font-bold text-called">{crmStats.called}</p>
          </div>
          <div className="rounded-xl border border-interested/15 bg-interested-bg p-3 text-center">
            <p className="text-xs text-interested/70 mb-0.5">Interested</p>
            <p className="text-xl font-bold text-interested">{crmStats.interested}</p>
          </div>
          <div className="rounded-xl border border-not-interested/15 bg-not-interested-bg p-3 text-center">
            <p className="text-xs text-not-interested/70 mb-0.5">Not Interested</p>
            <p className="text-xl font-bold text-not-interested">{crmStats.notInterested}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-text-muted" />
        {CALL_FILTER_OPTIONS.map(opt => (
          <button key={opt.value} onClick={() => setCallFilter(opt.value)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${callFilter === opt.value ? 'bg-accent/10 text-accent border-accent/20' : 'bg-bg-card text-text-secondary border-border hover:bg-bg-hover'}`}>{opt.label}</button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-danger/20 bg-danger-bg">
          <AlertCircle className="h-5 w-5 text-danger flex-shrink-0" />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {leads.length === 0 && !error ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/5 border border-accent/10 mb-4">
            <Bookmark className="h-7 w-7 text-accent/40" />
          </div>
          <h3 className="text-base font-semibold text-text-primary mb-1">
            {callFilter !== 'ALL' ? `No leads with status "${callFilter.replace('_', ' ')}"` : 'No saved leads yet'}
          </h3>
          <p className="text-sm text-text-muted">Search for businesses and save leads to build your pipeline</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {leads.map((lead) => {
              const tierCfg = TIER_CONFIG[lead.lead_tier] || TIER_CONFIG.LOW_VALUE;
              const callOpt = CALL_STATUS_OPTIONS.find(o => o.value === lead.call_status) || CALL_STATUS_OPTIONS[0];
              return (
                <motion.div key={lead.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className={`rounded-xl border bg-bg-card overflow-hidden transition-all ${lead.lead_tier === 'HOT_LEAD' ? 'border-hot/15 bg-hot/[0.02]' : 'border-border'}`}>
                  <div className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className={`flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-lg text-sm font-bold ${lead.score >= 80 ? 'bg-hot-bg text-hot border border-hot/20' : lead.score >= 50 ? 'bg-good-bg text-good border border-good/20' : 'bg-lowval-bg text-lowval border border-lowval/20'}`}>{lead.score}</div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-text-primary">{lead.name}</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${tierCfg.color}`}>{tierCfg.icon} {tierCfg.label}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                            {lead.phone ? <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover"><Phone className="h-3 w-3" />{lead.phone}</a> : <span className="text-xs text-text-muted">No phone</span>}
                            {lead.website ? <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover"><Globe className="h-3 w-3" />Website</a> : <span className="text-xs text-warn bg-warn-bg px-1.5 py-0.5 rounded">No website</span>}
                            {lead.address && <span className="text-xs text-text-muted line-clamp-1">{lead.address}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="relative">
                          <select value={lead.call_status} onChange={e => handleUpdateCallStatus(lead.id, e.target.value)} disabled={updatingId === lead.id} className={`appearance-none pl-3 pr-7 py-1.5 rounded-lg text-xs font-medium border cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all ${callOpt.color}`}>
                            {CALL_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none opacity-50" />
                        </div>
                        <button onClick={() => { const q = encodeURIComponent(`${lead.name} ${lead.address || ''}`); window.open(`https://www.google.com/search?q=${q}`, '_blank', 'noopener,noreferrer'); }} className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-all" title="Verify on Google"><ExternalLink className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(lead.id)} disabled={deletingId === lead.id} className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-bg transition-all disabled:cursor-not-allowed" title="Remove lead">{deletingId === lead.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</button>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border/50">
                      {editingNoteId === lead.id ? (
                        <div className="flex gap-2">
                          <input type="text" value={noteText} onChange={e => setNoteText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveNote(lead.id)} placeholder="Add a note about this lead..." className="flex-1 px-3 py-1.5 rounded-lg bg-bg-elevated border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-all" autoFocus />
                          <button onClick={() => handleSaveNote(lead.id)} className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent-hover transition-all">Save</button>
                          <button onClick={() => { setEditingNoteId(null); setNoteText(''); }} className="px-3 py-1.5 rounded-lg bg-bg-elevated text-text-muted text-xs font-medium hover:bg-bg-hover transition-all">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingNoteId(lead.id); setNoteText(lead.notes || ''); }} className="text-xs text-text-muted hover:text-text-secondary transition-colors">
                          {lead.notes ? <span>\ud83d\udcdd {lead.notes}</span> : <span className="italic">+ Add note...</span>}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
