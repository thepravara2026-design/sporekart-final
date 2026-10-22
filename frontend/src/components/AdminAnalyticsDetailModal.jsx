import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, Search, Copy, Check, ArrowUpRight, ExternalLink, Filter, 
  Sparkles, Layers, ChevronRight, BarChart3, Clock, CheckCircle2, 
  AlertCircle, ShieldCheck, ArrowUpDown, SlidersHorizontal, Tag
} from 'lucide-react';

/**
 * FAANG-Level Admin Analytics Detail Modal
 * Provides zero-lag, instant drill-down inspection for all analytics & metric cards
 * across every admin module with search, copy-to-clipboard, filter shortcuts, and detailed breakdown.
 */
export default function AdminAnalyticsDetailModal({ isOpen, onClose, config, onApplyFilter }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [activeSort, setActiveSort] = useState('DEFAULT');
  const [copiedId, setCopiedId] = useState(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Reset search and filters on modal reopen/config change
  useEffect(() => {
    setSearchQuery('');
    setActiveFilter(config?.defaultFilter || 'ALL');
    setActiveSort(config?.defaultSort || 'DEFAULT');
    setCopiedId(null);
  }, [isOpen, config?.title]);

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Compute filter pills with prior live item counts
  const resolvedFilterPills = useMemo(() => {
    const rawItems = Array.isArray(config?.items) ? config.items : [];
    
    if (config?.filterPills && Array.isArray(config.filterPills) && config.filterPills.length > 0) {
      return config.filterPills.map(pill => {
        let count = pill.count;
        if (count === undefined) {
          if (pill.id === 'ALL') {
            count = rawItems.length;
          } else if (typeof pill.filterFn === 'function') {
            count = rawItems.filter(pill.filterFn).length;
          } else {
            count = rawItems.filter(item => 
              item.status === pill.id || 
              item.category === pill.id || 
              item.metadata?.Category === pill.id ||
              item.rawCategory === pill.id
            ).length;
          }
        }
        return { ...pill, count };
      });
    }

    // Auto-derive smart filter pills if not explicitly provided
    const totalCount = rawItems.length;
    const pills = [
      { id: 'ALL', label: 'All Items', count: totalCount, isHighlighted: true }
    ];

    // From config.breakdown if available
    if (config?.breakdown && Array.isArray(config.breakdown)) {
      config.breakdown.forEach((b) => {
        const labelLower = b.label.toLowerCase();
        const count = rawItems.filter(item => {
          const str = `${item.title || ''} ${item.subtitle || ''} ${item.status || ''} ${JSON.stringify(item.metadata || {})}`.toLowerCase();
          return str.includes(labelLower);
        }).length;

        if (count > 0 && !pills.some(p => p.label.toLowerCase() === labelLower)) {
          pills.push({
            id: b.label,
            label: b.label,
            count: typeof b.value === 'number' ? b.value : count,
            filterFn: (item) => {
              const str = `${item.title || ''} ${item.subtitle || ''} ${item.status || ''} ${JSON.stringify(item.metadata || {})}`.toLowerCase();
              return str.includes(labelLower);
            }
          });
        }
      });
    }

    // From item statuses if breakdown didn't yield extra pills
    if (pills.length === 1) {
      const distinctStatuses = Array.from(new Set(rawItems.map(i => i.status).filter(Boolean)));
      if (distinctStatuses.length > 1 && distinctStatuses.length <= 8) {
        distinctStatuses.forEach(st => {
          const count = rawItems.filter(i => i.status === st).length;
          pills.push({
            id: st,
            label: st,
            count,
            filterFn: i => i.status === st
          });
        });
      }
    }

    return pills;
  }, [config?.filterPills, config?.breakdown, config?.items]);

  // Compute sorting pills
  const resolvedSortingPills = useMemo(() => {
    if (config?.sortingPills && Array.isArray(config.sortingPills) && config.sortingPills.length > 0) {
      return config.sortingPills;
    }

    const rawItems = Array.isArray(config?.items) ? config.items : [];
    const hasAmount = rawItems.some(i => i.amount !== undefined && i.amount !== null);
    const hasDate = rawItems.some(i => i.date);

    const defaultPills = [
      { id: 'DEFAULT', label: 'Default' },
      { id: 'NAME_ASC', label: 'Name (A → Z)' },
      { id: 'NAME_DESC', label: 'Name (Z → A)' },
    ];

    if (hasAmount) {
      defaultPills.push({ id: 'AMOUNT_DESC', label: 'Price/Amount: High → Low' });
      defaultPills.push({ id: 'AMOUNT_ASC', label: 'Price/Amount: Low → High' });
    }

    if (hasDate) {
      defaultPills.push({ id: 'DATE_DESC', label: 'Newest First' });
      defaultPills.push({ id: 'DATE_ASC', label: 'Oldest First' });
    }

    defaultPills.push({ id: 'STATUS', label: 'Status' });

    return defaultPills;
  }, [config?.sortingPills, config?.items]);

  // Filter and sort items based on activeFilter, searchQuery, and activeSort
  const filteredItems = useMemo(() => {
    if (!config?.items || !Array.isArray(config.items)) return [];
    let items = [...config.items];

    // 1. Filter by active filter pill
    if (activeFilter && activeFilter !== 'ALL') {
      const activePillObj = resolvedFilterPills.find(p => p.id === activeFilter);
      if (activePillObj?.filterFn) {
        items = items.filter(activePillObj.filterFn);
      } else {
        const f = activeFilter.toLowerCase();
        items = items.filter(item => {
          const statusMatch = item.status?.toLowerCase() === f;
          const catMatch = item.category?.toLowerCase() === f || item.metadata?.Category?.toLowerCase() === f;
          const titleMatch = item.title?.toLowerCase().includes(f);
          const subMatch = item.subtitle?.toLowerCase().includes(f);
          return statusMatch || catMatch || titleMatch || subMatch;
        });
      }
    }

    // 2. Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((item) => {
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchSubtitle = item.subtitle?.toLowerCase().includes(q);
        const matchId = item.id?.toLowerCase().includes(q);
        const matchStatus = item.status?.toLowerCase().includes(q);
        const matchAmount = item.amount?.toString().toLowerCase().includes(q);
        const matchMeta = item.metadata ? Object.values(item.metadata).join(' ').toLowerCase().includes(q) : false;
        return matchTitle || matchSubtitle || matchId || matchStatus || matchAmount || matchMeta;
      });
    }

    // 3. Apply active sorting pill
    const activeSortPillObj = resolvedSortingPills.find(s => s.id === activeSort);
    if (activeSortPillObj?.sortFn) {
      items.sort(activeSortPillObj.sortFn);
    } else {
      switch (activeSort) {
        case 'NAME_ASC':
          items.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
          break;
        case 'NAME_DESC':
          items.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
          break;
        case 'AMOUNT_DESC':
        case 'PRICE_DESC':
          items.sort((a, b) => {
            const valA = typeof a.amount === 'number' ? a.amount : parseFloat(String(a.amount).replace(/[^0-9.-]+/g, '')) || 0;
            const valB = typeof b.amount === 'number' ? b.amount : parseFloat(String(b.amount).replace(/[^0-9.-]+/g, '')) || 0;
            return valB - valA;
          });
          break;
        case 'AMOUNT_ASC':
        case 'PRICE_ASC':
          items.sort((a, b) => {
            const valA = typeof a.amount === 'number' ? a.amount : parseFloat(String(a.amount).replace(/[^0-9.-]+/g, '')) || 0;
            const valB = typeof b.amount === 'number' ? b.amount : parseFloat(String(b.amount).replace(/[^0-9.-]+/g, '')) || 0;
            return valA - valB;
          });
          break;
        case 'DATE_DESC':
          items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
          break;
        case 'DATE_ASC':
          items.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
          break;
        case 'STATUS':
          items.sort((a, b) => (a.status || '').localeCompare(b.status || ''));
          break;
        case 'STOCK_DESC':
          items.sort((a, b) => {
            const stockA = a.metadata?.Variants || a.stock || 0;
            const stockB = b.metadata?.Variants || b.stock || 0;
            return stockB - stockA;
          });
          break;
        case 'ORDER_NUM':
          items.sort((a, b) => (b.id || '').localeCompare(a.id || ''));
          break;
        case 'DEFAULT':
        default:
          break;
      }
    }

    return items;
  }, [config?.items, activeFilter, searchQuery, activeSort, resolvedFilterPills, resolvedSortingPills]);

  if (!isOpen || !config) return null;

  const Icon = config.icon || BarChart3;

  const getBadgeStyle = (color) => {
    switch (color) {
      case 'green':
      case 'emerald':
        return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';
      case 'amber':
      case 'gold':
        return 'bg-amber-500/10 text-amber-800 border-amber-500/20';
      case 'rose':
      case 'red':
        return 'bg-rose-500/10 text-rose-700 border-rose-500/20';
      case 'blue':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'purple':
        return 'bg-purple-500/10 text-purple-700 border-purple-500/20';
      default:
        return 'bg-forest-900/10 text-forest-800 border-forest-900/20';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-forest-950/65 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      data-testid="admin-analytics-modal-backdrop"
    >
      <div 
        className="bg-surface-white w-full max-w-3xl rounded-3xl border border-surface-border shadow-level-3 flex flex-col max-h-[92vh] overflow-hidden animate-scale-in relative text-typography-primary"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="analytics-modal-title"
      >
        {/* Glow Accent Top Banner */}
        <div className="h-1.5 w-full bg-gradient-to-r from-forest-700 via-gold to-emerald-500 shrink-0" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-surface-border flex items-start justify-between gap-4 bg-surface-cream/40">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-forest-900 text-white flex items-center justify-center shadow-level-1 shrink-0 mt-0.5">
              <Icon className="w-6 h-6 text-gold" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-forest-900/5 text-forest-900 border border-forest-900/10 font-mono">
                  {config.domain || 'Admin Control Plane'}
                </span>
                {config.badge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getBadgeStyle(config.badgeColor)}`}>
                    {config.badge}
                  </span>
                )}
              </div>
              <h2 id="analytics-modal-title" className="text-xl sm:text-2xl font-black font-display text-typography-primary leading-tight">
                {config.title}
              </h2>
              {config.subtitle && (
                <p className="text-xs text-typography-secondary mt-1 max-w-xl">
                  {config.subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-typography-muted hover:text-typography-primary hover:bg-surface-border/50 transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hero Metric & Sub-breakdown Ribbon */}
        <div className="px-5 sm:px-6 py-4 bg-surface-cream/80 border-b border-surface-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-typography-muted block">
              Aggregate Live Value
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl sm:text-4xl font-black font-display text-forest-900">
                {config.metric}
              </span>
              {config.metricSubtext && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {config.metricSubtext}
                </span>
              )}
            </div>
          </div>

          {config.breakdown && config.breakdown.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full sm:w-auto">
              {config.breakdown.map((b, idx) => {
                const matchPill = resolvedFilterPills.find(p => 
                  p.label.toLowerCase() === b.label.toLowerCase() || 
                  p.id.toLowerCase() === b.label.toLowerCase()
                );
                return (
                  <div
                    key={idx}
                    role={matchPill ? 'button' : undefined}
                    tabIndex={matchPill ? 0 : undefined}
                    onClick={() => {
                      if (matchPill) {
                        setActiveFilter(activeFilter === matchPill.id ? 'ALL' : matchPill.id);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (matchPill && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        setActiveFilter(activeFilter === matchPill.id ? 'ALL' : matchPill.id);
                      }
                    }}
                    className={`bg-surface-white px-3 py-2 rounded-xl border border-surface-border shadow-2xs transition-all select-none ${
                      matchPill ? 'cursor-pointer hover:border-forest-700/60 hover:shadow-level-1 group' : ''
                    } ${matchPill && activeFilter === matchPill.id ? 'ring-2 ring-forest-700/50 bg-forest-900/5 border-forest-700' : ''}`}
                    title={matchPill ? `Filter items by ${b.label}` : undefined}
                  >
                    <span className="text-[10px] font-bold uppercase text-typography-muted block truncate group-hover:text-forest-700">
                      {b.label}
                    </span>
                    <span className="text-sm font-extrabold text-typography-primary font-display block mt-0.5">
                      {b.value}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Dynamic Category/Filter Pills Ribbon with Live Prior Counts */}
        {resolvedFilterPills.length > 0 && (
          <div className="px-5 sm:px-6 py-2.5 bg-surface-cream/50 border-b border-surface-border flex items-center gap-2 overflow-x-auto scrollbar-thin">
            <span className="text-[10px] font-black uppercase tracking-wider text-typography-muted flex items-center gap-1 shrink-0 font-mono">
              <Filter className="w-3 h-3 text-forest-700" /> Filter:
            </span>
            <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
              {resolvedFilterPills.map((pill) => {
                const isActive = activeFilter === pill.id;
                const isHighlighted = pill.isHighlighted || pill.id === 'ALL';
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setActiveFilter(pill.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 border select-none ${
                      isActive
                        ? 'bg-forest-900 text-white border-forest-900 shadow-level-1 ring-2 ring-forest-700/20'
                        : isHighlighted
                          ? 'bg-forest-900/10 text-forest-900 border-forest-900/30 hover:bg-forest-900/15'
                          : 'bg-surface-white text-typography-secondary hover:text-typography-primary hover:bg-surface-cream border-surface-border'
                    }`}
                    data-testid={`filter-pill-${pill.id.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                  >
                    <span>{pill.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-extrabold ${
                        isActive
                          ? 'bg-white/25 text-white'
                          : isHighlighted
                            ? 'bg-forest-900 text-white'
                            : 'bg-forest-900/10 text-forest-800'
                      }`}
                    >
                      {pill.count ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Instant Search Bar & Sorting Pills Bar */}
        <div className="px-5 sm:px-6 py-3 border-b border-surface-border bg-surface-white space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-typography-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={`Search ${filteredItems.length} items (name, ref ID, amount, status)...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-cream/50 border border-surface-border rounded-xl pl-9 pr-8 py-2 text-xs text-typography-primary focus:outline-none focus:border-forest-700 focus:bg-surface-white transition-all"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-typography-muted hover:text-typography-primary text-xs font-bold"
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
            <span className="text-xs text-typography-muted font-mono shrink-0">
              {filteredItems.length} of {config.items?.length || 0} record{config.items?.length === 1 ? '' : 's'}
            </span>
          </div>

          {/* Interactive Sorting Pills Ribbon */}
          {resolvedSortingPills.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pt-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-typography-muted flex items-center gap-1 shrink-0 font-mono">
                <ArrowUpDown className="w-3 h-3 text-gold" /> Sort:
              </span>
              <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
                {resolvedSortingPills.map((sortPill) => {
                  const isSortActive = activeSort === sortPill.id;
                  return (
                    <button
                      key={sortPill.id}
                      type="button"
                      onClick={() => setActiveSort(sortPill.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 border select-none ${
                        isSortActive
                          ? 'bg-gold/25 text-forest-900 border-gold/50 shadow-2xs font-extrabold ring-1 ring-gold/40'
                          : 'bg-surface-cream/60 text-typography-muted hover:text-typography-primary border-surface-border hover:bg-surface-cream'
                      }`}
                      data-testid={`sort-pill-${sortPill.id.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                    >
                      {sortPill.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Items List */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-2.5 max-h-[46vh] scrollbar-thin bg-surface-cream/20">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => (
              <div
                key={item.id || index}
                className="bg-surface-white p-3.5 sm:p-4 rounded-2xl border border-surface-border hover:border-forest-700/50 hover:shadow-level-1 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-forest-900/5 text-forest-800 border border-forest-900/10 flex items-center justify-center shrink-0 font-bold text-xs font-mono">
                    {index + 1}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs sm:text-sm text-typography-primary truncate block">
                        {item.title}
                      </span>
                      {item.status && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase ${getBadgeStyle(item.statusColor || 'forest')}`}>
                          {item.status}
                        </span>
                      )}
                    </div>
                    {item.subtitle && (
                      <p className="text-xs text-typography-secondary truncate">
                        {item.subtitle}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-typography-muted flex-wrap">
                      {item.id && (
                        <button
                          type="button"
                          onClick={() => handleCopy(item.id, item.id)}
                          className="font-mono text-[10px] bg-surface-cream px-1.5 py-0.5 rounded border border-surface-border hover:border-forest-700/50 flex items-center gap-1 transition-colors"
                          title="Click to copy ID"
                        >
                          <span>ID: {item.id.length > 16 ? item.id.substring(0, 14) + '...' : item.id}</span>
                          {copiedId === item.id ? (
                            <Check className="w-2.5 h-2.5 text-green-600" />
                          ) : (
                            <Copy className="w-2.5 h-2.5 text-typography-muted" />
                          )}
                        </button>
                      )}
                      {item.date && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-typography-muted" />
                          {item.date}
                        </span>
                      )}
                      {item.metadata && Object.entries(item.metadata).map(([k, v]) => (
                        <span key={k} className="inline-block">
                          <strong className="text-typography-secondary">{k}:</strong> {String(v)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  {item.amount !== undefined && item.amount !== null && (
                    <span className="text-sm sm:text-base font-black text-forest-900 font-display">
                      {typeof item.amount === 'number' ? `₹${item.amount.toLocaleString('en-IN')}` : item.amount}
                    </span>
                  )}
                  {item.onAction && (
                    <button
                      onClick={() => {
                        item.onAction();
                        onClose();
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-surface-cream hover:bg-forest-900 hover:text-white border border-surface-border text-xs font-bold text-typography-secondary flex items-center gap-1 transition-all"
                    >
                      <span>{item.actionLabel || 'Inspect'}</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 px-4 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-surface-cream border border-surface-border flex items-center justify-center mx-auto text-typography-muted">
                <Search className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-typography-primary font-display">
                No matching records found
              </h4>
              <p className="text-xs text-typography-muted max-w-sm mx-auto">
                {searchQuery
                  ? `No details match "${searchQuery}". Try refining your search query.`
                  : 'There are currently no active records logged for this metric segment.'}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-surface-border bg-surface-cream/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-typography-muted">
            <span className="hidden sm:inline">Press</span>
            <kbd className="px-2 py-0.5 text-[10px] font-mono font-bold bg-surface-white border border-surface-border rounded shadow-2xs">
              ESC
            </kbd>
            <span>to close inspect window</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {config.actionButton && (
              <button
                onClick={() => {
                  if (config.actionButton.onClick) config.actionButton.onClick();
                  onClose();
                }}
                className="flex-1 sm:flex-initial btn-primary px-4 py-2 text-xs font-bold flex items-center justify-center gap-1.5 shadow-level-1"
              >
                <span>{config.actionButton.label}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial btn-secondary px-4 py-2 text-xs font-bold text-typography-secondary hover:text-typography-primary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * FAANG-Grade Interactive Analytics Metric Card
 * Replaces static metric boxes with interactive, accessible cards that trigger detailed drill-down inspection.
 */
export function AnalyticsMetricCard({
  title,
  label,
  value,
  subtext,
  subtitle,
  badge,
  trend,
  badgeStyle,
  icon: Icon,
  iconColor,
  valueColor = 'text-typography-primary',
  variant = 'default',
  onClick,
  className = '',
  testId,
}) {
  const displayTitle = title || label;
  const displaySubtext = subtext || subtitle;
  const displayBadge = badge || trend;

  let computedBadgeStyle = badgeStyle;
  if (!computedBadgeStyle) {
    if (variant === 'forest' || variant === 'green') {
      computedBadgeStyle = 'bg-forest-800/10 text-forest-800 border border-forest-800/20';
    } else if (variant === 'amber') {
      computedBadgeStyle = 'bg-amber-500/10 text-amber-800 border border-amber-500/20';
    } else if (variant === 'red') {
      computedBadgeStyle = 'bg-red-500/10 text-red-700 border border-red-500/20';
    } else if (variant === 'blue') {
      computedBadgeStyle = 'bg-blue-500/10 text-blue-700 border border-blue-500/20';
    } else {
      computedBadgeStyle = 'bg-forest-800/10 text-forest-800 border border-forest-800/20';
    }
  }

  let computedIconColor = iconColor;
  if (!computedIconColor) {
    if (variant === 'forest' || variant === 'green') computedIconColor = 'text-forest-700';
    else if (variant === 'amber') computedIconColor = 'text-amber-600';
    else if (variant === 'red') computedIconColor = 'text-red-600';
    else if (variant === 'blue') computedIconColor = 'text-blue-600';
    else computedIconColor = 'text-forest-700';
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick && onClick();
        }
      }}
      className={`bg-surface-white p-5 rounded-card border border-surface-border shadow-level-1 space-y-2 hover-lift relative overflow-hidden cursor-pointer group hover:border-forest-700/60 hover:shadow-level-2 transition-all duration-200 select-none focus:outline-none focus:ring-2 focus:ring-forest-700/30 ${className}`}
      data-testid={testId}
      title="Click for quick analytics breakdown & details"
    >
      <div className="flex items-center justify-between text-typography-muted">
        <span className="text-xs font-bold uppercase tracking-wider truncate pr-2">{displayTitle}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-forest-700 font-extrabold flex items-center gap-0.5">
            Inspect <ArrowUpRight className="w-2.5 h-2.5" />
          </span>
          {Icon && <Icon className={`w-4 h-4 ${computedIconColor} group-hover:scale-110 transition-transform`} />}
        </div>
      </div>

      <p className={`text-2xl sm:text-3xl font-black font-display truncate ${valueColor}`}>
        {value}
      </p>

      <div className="flex items-center justify-between gap-1 pt-0.5">
        {displayBadge ? (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block truncate ${computedBadgeStyle}`}>
            {displayBadge}
          </span>
        ) : displaySubtext ? (
          <span className="text-[10px] text-typography-muted truncate">{displaySubtext}</span>
        ) : null}
        <span className="text-[9px] text-typography-muted font-mono opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
          Click ↗
        </span>
      </div>
    </div>
  );
}

