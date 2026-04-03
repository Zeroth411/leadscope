import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Download, Filter, AlertCircle, Loader2, MapPin, Phone, Globe, Bookmark, ChevronDown, ExternalLink, Flame, ArrowUpDown, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfigError from '../components/ConfigError';

interface Lead {
  name: string;
  phone: string;
  address: string;
  website: string;
  rating: number;
  reviewCount: number;
  status: 'HIGH_PRIORITY' | 'NO_PHONE' | 'LOW_PRIORITY';
  score: number;
  leadTier: 'HOT_LEAD' | 'GOOD_LEAD' | 'LOW_VALUE';
  relevant: boolean;
}

const CATEGORIES = [
  { value: 'restaurant', label: 'Restaurants', emoji: '\ud83c\udf7d\ufe0f' },
  { value: 'cafe', label: 'Caf\u00e9s', emoji: '\u2615' },
  { value: 'salon', label: 'Salons', emoji: '\ud83d\udc87' },
  { value: 'shop', label: 'Shops', emoji: '\ud83c\udfea' },
  { value: 'gym', label: 'Gyms', emoji: '\ud83d\udcaa' },
  { value: 'hotel', label: 'Hotels', emoji: '\ud83c\udfe8' },
  { value: 'clinic', label: 'Clinics', emoji: '\ud83c\udfe5' },
  { value: 'pharmacy', label: 'Pharmacies', emoji: '\ud83d\udc8a' },
  { value: 'school', label: 'Schools', emoji: '\ud83c\udfeb' },
  { value: 'dentist', label: 'Dentists', emoji: '\ud83e\uddb7' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  HIGH_PRIORITY: { label: 'High Priority', color: 'bg-high-bg text-high border border-high/20', dot: 'bg-high' },
  NO_PHONE: { label: 'No Phone', color: 'bg-warn-bg text-warn border border-warn/20', dot: 'bg-warn' },
  LOW_PRIORITY: { label: 'Low Priority', color: 'bg-low-bg text-low border border-low/20', dot: 'bg-low' },
};

const TIER_CONFIG: Record<string, { label: string; color: string; icon: string; glow: string }> = {
  HOT_LEAD: { label: 'Hot Lead', color: 'bg-hot-bg text-hot border border-hot/25', icon: '\ud83d\udd25', glow: 'shadow-hot/10 shadow-lg' },
  GOOD_LEAD: { label: 'Good Lead', color: 'bg-good-bg text-good border border-good/25', icon: '\u2705', glow: '' },
  LOW_VALUE: { label: 'Low Value', color: 'bg-lowval-bg text-lowval border border-lowval/25', icon: '\u2b1c', glow: '' },
};

type SortField = 'score' | 'name' | 'status';
type SortDir = 'asc' | 'desc';

export default function SearchPage() {
  const [area, setArea] = useState('');
  const [category, setCategory] = useState('restaurant');
  const [noWebsiteOnly, setNoWebsiteOnly] = useState(false);
  const [relevantOnly, setRelevantOnly] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [configError, setConfigError] = useState('');
  const [searched, setSearched] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedNames, setSavedNames] = useState<Set<string>>(new Set());
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQueryRef = useRef<string>('');

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const executeSearch = useCallback(async () => {
    if (!area.trim()) {
      setError('Please enter an area to search');
      return;
    }

    const queryKey = `${category}|${area.trim()}|${noWebsiteOnly}|${relevantOnly}`;
    if (queryKey === lastQueryRef.current && leads.length > 0) return;
    lastQueryRef.current = queryKey;

    setLoading(true);
    setError('');
    setConfigError('');
    setSearched(true);
    setLeads([]);

    try {
      const query = `${category} in ${area.trim()}`;
      const params = new URLSearchParams({ query });
      if (noWebsiteOnly) params.set('noWebsiteOnly', 'true');
      if (relevantOnly) params.set('relevantOnly', 'true');

      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        // Distinguish config errors from search errors
        if (res.status === 503) {
          setConfigError(data.error || 'Missing server configuration');
          return;
        }
        throw new Error(data.error || `Server error (${res.status})`);
      }

      if (Array.isArray(data)) {
        setLeads(data);
        if (data.length === 0) {
          setError('No results found for this search. Try a different area or category.');
        }
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch results');
      lastQueryRef.current = '';
    } finally {
      setLoading(false);
    }
  }, [area, category, noWebsiteOnly, relevantOnly, leads.length]);

  const handleSearch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      executeSearch();
    }, 700);
  }, [executeSearch]);

  const handleSearchImmediate = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    lastQueryRef.current = '';
    executeSearch();
  }, [executeSearch]);

  const handleExportCSV = useCallback(() => {
    if (leads.length === 0) return;
    const displayLeads = getFilteredSortedLeads();
    const headers = ['Name', 'Phone', 'Address', 'Status', 'Score', 'Lead Tier'];
    const rows = displayLeads.map(l => [
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${l.phone || ''}"`,
      `"${(l.address || '').replace(/"/g, '""')}"`,
      `"${l.status || ''}"`,
      `"${l.score || 0}"`,
      `"${l.leadTier || ''}"`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads_${area.trim().replace(/\s+/g, '_')}_${category}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [leads, area, category, tierFilter, sortField, sortDir]);

  const handleSaveLead = useCallback(async (lead: Lead) => {
    const key = `${lead.name}-${lead.phone}`;
    setSavingId(key);
    try {
      const res = await fetch('/api/saved-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: lead.name,
          phone: lead.phone,
          address: lead.address,
          website: lead.website,
          status: lead.status,
          score: lead.score,
          lead_tier: lead.leadTier,
        }),
      });
      if (res.ok) {
        setSavedNames(prev => new Set([...prev, key]));
      }
    } catch (err) {
      console.error('Failed to save lead:', err);
    } finally {
      setSavingId(null);
    }
  }, []);

  const handleGoogleVerify = useCallback((lead: Lead) => {
    const q = encodeURIComponent(`${lead.name} ${area.trim()}`);
    window.open(`https://www.google.com/search?q=${q}`, '_blank', 'noopener,noreferrer');
  }, [area]);

  const toggleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }, [sortField]);

  const getFilteredSortedLeads = useCallback(() => {
    let filtered = tierFilter === 'ALL' ? leads : leads.filter(l => l.leadTier === tierFilter);
    filtered = [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'score') cmp = a.score - b.score;
      else if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'status') cmp = a.status.localeCompare(b.status);
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return filtered;
  }, [leads, tierFilter, sortField, sortDir]);

  const filteredLeads = getFilteredSortedLeads();

  const stats = {
    total: leads.length,
    hot: leads.filter(l => l.leadTier === 'HOT_LEAD').length,
    good: leads.filter(l => l.leadTier === 'GOOD_LEAD').length,
    lowVal: leads.filter(l => l.leadTier === 'LOW_VALUE').length,
    avgScore: leads.length > 0 ? Math.round(leads.reduce((s, l) => s + l.score, 0) / leads.length) : 0,
  };

  return (
    <div className="space-y-5">
      {/* Search Panel */}
      <div className="rounded-xl border border-border bg-bg-card p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-5">
          <Search className="h-5 w-5 text-accent" />
          <h2 className="text-base font-semibold text-text-primary">Find Local Business Leads</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-text-muted mb-1.5">Area / Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                value={area}
                onChange={e => { setArea(e.target.value); handleSearch(); }}
                onKeyDown={e => e.key === 'Enter' && handleSearchImmediate()}
                placeholder="e.g. Vijay Nagar, Indore"
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-bg-elevated border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus/30 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Category</label>
            <div className="relative">
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full appearance-none pl-4 pr-9 py-2.5 rounded-lg bg-bg-elevated border border-border text-sm text-text-primary focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus/30 transition-all"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col justify-end gap-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <div className="relative">
                <input type="checkbox" checked={noWebsiteOnly} onChange={e => setNoWebsiteOnly(e.target.checked)} className="sr-only peer" />
                <div className="w-9 h-5 bg-bg-elevated border border-border rounded-full peer-checked:bg-accent/20 peer-checked:border-accent/40 transition-all" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-text-muted rounded-full transition-all peer-checked:translate-x-4 peer-checked:bg-accent" />
              </div>
              <span className="text-xs font-medium text-text-secondary whitespace-nowrap">No website only</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <div className="relative">
                <input type="checkbox" checked={relevantOnly} onChange={e => setRelevantOnly(e.target.checked)} className="sr-only peer" />
                <div className="w-9 h-5 bg-bg-elevated border border-border rounded-full peer-checked:bg-accent/20 peer-checked:border-accent/40 transition-all" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-text-muted rounded-full transition-all peer-checked:translate-x-4 peer-checked:bg-accent" />
              </div>
              <span className="text-xs font-medium text-text-secondary whitespace-nowrap">Relevant only</span>
            </label>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSearchImmediate}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all duration-200 shadow-lg shadow-accent/20"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
      </div>

      {/* Config Error */}
      {configError && (
        <ConfigError message={configError} onRetry={handleSearchImmediate} />
      )}

      {/* Search Error */}
      <AnimatePresence>
        {error && leads.length === 0 && !configError && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex items-center gap-3 p-4 rounded-xl border border-danger/20 bg-danger-bg">
            <AlertCircle className="h-5 w-5 text-danger flex-shrink-0" />
            <p className="text-sm text-danger">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-bg-card p-4">
              <div className="flex gap-4 items-center">
                <div className="skeleton h-10 w-10 rounded-lg flex-shrink-0" />
                <div className="skeleton h-5 w-40 rounded" />
                <div className="skeleton h-5 w-28 rounded" />
                <div className="skeleton h-5 w-56 rounded flex-1 hidden lg:block" />
                <div className="skeleton h-6 w-16 rounded-full" />
                <div className="skeleton h-6 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && searched && leads.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-border bg-bg-card p-4">
              <p className="text-xs text-text-muted font-medium mb-1">Total Found</p>
              <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
            </div>
            <div className="rounded-xl border border-hot/15 bg-hot-bg p-4">
              <p className="text-xs text-hot/70 font-medium mb-1">\ud83d\udd25 Hot Leads</p>
              <p className="text-2xl font-bold text-hot">{stats.hot}</p>
            </div>
            <div className="rounded-xl border border-good/15 bg-good-bg p-4">
              <p className="text-xs text-good/70 font-medium mb-1">\u2705 Good Leads</p>
              <p className="text-2xl font-bold text-good">{stats.good}</p>
            </div>
            <div className="rounded-xl border border-border bg-bg-card p-4">
              <p className="text-xs text-text-muted font-medium mb-1">Avg Score</p>
              <p className="text-2xl font-bold text-accent">{stats.avgScore}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: 'ALL', label: `All (${stats.total})`, style: 'bg-accent/10 text-accent border-accent/20' },
                { key: 'HOT_LEAD', label: `Hot (${stats.hot})`, style: 'bg-hot-bg text-hot border-hot/20' },
                { key: 'GOOD_LEAD', label: `Good (${stats.good})`, style: 'bg-good-bg text-good border-good/20' },
                { key: 'LOW_VALUE', label: `Low (${stats.lowVal})`, style: 'bg-lowval-bg text-lowval border-lowval/20' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setTierFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    tierFilter === f.key ? f.style : 'bg-bg-card text-text-secondary border-border hover:bg-bg-hover'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => toggleSort('score')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${sortField === 'score' ? 'bg-accent/10 text-accent border-accent/20' : 'bg-bg-card text-text-secondary border-border hover:bg-bg-hover'}`}>
                <ArrowUpDown className="h-3 w-3" /> Score {sortField === 'score' && (sortDir === 'desc' ? '\u2193' : '\u2191')}
              </button>
              <button onClick={() => toggleSort('name')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${sortField === 'name' ? 'bg-accent/10 text-accent border-accent/20' : 'bg-bg-card text-text-secondary border-border hover:bg-bg-hover'}`}>
                <ArrowUpDown className="h-3 w-3" /> Name {sortField === 'name' && (sortDir === 'desc' ? '\u2193' : '\u2191')}
              </button>
              <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-card border border-border text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-all">
                <Download className="h-3.5 w-3.5" /> Export CSV
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-bg-elevated/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Score</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Business</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Phone</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider hidden xl:table-cell">Address</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider hidden md:table-cell">Website</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Tier</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider hidden lg:table-cell">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead, i) => {
                    const statusCfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG.LOW_PRIORITY;
                    const tierCfg = TIER_CONFIG[lead.leadTier] || TIER_CONFIG.LOW_VALUE;
                    const key = `${lead.name}-${lead.phone}`;
                    const isSaved = savedNames.has(key);
                    const isSaving = savingId === key;
                    return (
                      <motion.tr
                        key={i}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.015, 0.4) }}
                        className={`border-b border-border/40 last:border-0 hover:bg-bg-hover/50 transition-colors ${lead.leadTier === 'HOT_LEAD' ? 'bg-hot/[0.02]' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <div className={`score-badge inline-flex items-center justify-center w-10 h-10 rounded-lg text-sm font-bold ${lead.score >= 80 ? 'bg-hot-bg text-hot border border-hot/20' : lead.score >= 50 ? 'bg-good-bg text-good border border-good/20' : 'bg-lowval-bg text-lowval border border-lowval/20'}`}>{lead.score}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <span className="text-sm font-medium text-text-primary">{lead.name}</span>
                            {lead.rating > 0 && <span className="inline-flex items-center gap-0.5 ml-2 text-xs text-warn"><Star className="h-3 w-3 fill-current" />{lead.rating.toFixed(1)}</span>}
                          </div>
                          {lead.address && <p className="text-xs text-text-muted mt-0.5 line-clamp-1 max-w-[200px] xl:hidden">{lead.address}</p>}
                        </td>
                        <td className="px-4 py-3">
                          {lead.phone ? <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover transition-colors"><Phone className="h-3.5 w-3.5" />{lead.phone}</a> : <span className="text-sm text-text-muted">\u2014</span>}
                        </td>
                        <td className="px-4 py-3 hidden xl:table-cell"><span className="text-sm text-text-secondary line-clamp-1 max-w-[250px]">{lead.address || '\u2014'}</span></td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {lead.website ? <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover transition-colors"><Globe className="h-3.5 w-3.5" />Visit</a> : <span className="text-xs text-text-muted bg-warn-bg px-2 py-0.5 rounded">None</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${tierCfg.color} ${tierCfg.glow}`}><span>{tierCfg.icon}</span>{tierCfg.label}</span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.color}`}><span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />{statusCfg.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleGoogleVerify(lead)} className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-all" title="Verify on Google"><ExternalLink className="h-4 w-4" /></button>
                            <button onClick={() => handleSaveLead(lead)} disabled={isSaved || isSaving} className={`p-1.5 rounded-lg transition-all ${isSaved ? 'text-accent bg-accent/10' : 'text-text-muted hover:text-accent hover:bg-accent/10'} disabled:cursor-not-allowed`} title={isSaved ? 'Saved' : 'Save lead'}>
                              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />}
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredLeads.length === 0 && (
              <div className="p-8 text-center">
                <Filter className="h-8 w-8 text-text-muted mx-auto mb-2" />
                <p className="text-sm text-text-muted">No leads match the selected filter</p>
              </div>
            )}
          </div>
          <p className="text-xs text-text-muted text-center">Showing {filteredLeads.length} of {leads.length} results \u00b7 Sorted by {sortField} ({sortDir === 'desc' ? 'highest first' : 'lowest first'})</p>
        </motion.div>
      )}

      {/* Empty State */}
      {!loading && !searched && !configError && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/5 to-hot/5 border border-accent/10 mb-5">
            <Flame className="h-9 w-9 text-accent/40" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">Find high-value business leads</h3>
          <p className="text-sm text-text-muted max-w-lg mx-auto leading-relaxed">
            Enter an area and category to discover local businesses. Each lead is scored and ranked \u2014 <span className="text-hot">Hot Leads</span> have phones but no website, making them perfect cold call targets.
          </p>
          <div className="flex items-center justify-center gap-6 mt-6 text-xs text-text-muted">
            <div className="flex items-center gap-1.5"><span className="text-hot">\ud83d\udd25</span> Score 80+ = Hot Lead</div>
            <div className="flex items-center gap-1.5"><span className="text-good">\u2705</span> Score 50-79 = Good Lead</div>
            <div className="flex items-center gap-1.5"><span className="text-lowval">\u2b1c</span> Score &lt;50 = Low Value</div>
          </div>
        </div>
      )}
    </div>
  );
}
