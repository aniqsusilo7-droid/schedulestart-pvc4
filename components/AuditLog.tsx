import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Database,
  Filter,
  History,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { db, collection, getDocs, query as fsQuery, orderBy, limit as fsLimit, where } from '../firebaseClient';
import { auditEventLabel, AuditLogRow } from '../utils/auditLog';
import { ShiftSlot } from '../utils/shiftSchedule';

const SHIFT_OPTIONS: ShiftSlot[] = ['I', 'II', 'III'];
const PAGE_SIZE = 40;
const EVENT_OPTIONS = [
  { value: 'schedule', label: 'Schedule' },
  { value: 'silo', label: 'Silo' },
  { value: 'steam_adjust', label: 'Steam adjust' },
  { value: 'grade', label: 'Grade' },
  { value: 'cycle_time', label: 'Cycle time' },
  { value: 'settings', label: 'Pengaturan' },
];

const categoryFromEvent = (eventType: string) => eventType.split('.')[0];

const EVENT_COLORS: Record<string, string> = {
  schedule: 'bg-amber-500 text-slate-950',
  silo: 'bg-cyan-500 text-slate-950',
  steam_adjust: 'bg-teal-500 text-slate-950',
  grade: 'bg-fuchsia-500 text-white',
  grade_mode: 'bg-fuchsia-500 text-white',
  cycle_time: 'bg-blue-500 text-white',
  settings: 'bg-slate-500 text-white',
};

const formatTimestamp = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(date);
};

const formatValue = (value: unknown) => {
  if (value === null || value === undefined) return '—';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const prettyGroup = (group?: string) => (group ? `Grup ${group.replace(/^GRUP\s+/i, '')}` : '—');

export const AuditLog: React.FC = () => {
  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchText, setSearchText] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [shift, setShift] = useState<'all' | ShiftSlot>('all');
  const [date, setDate] = useState('');
  const [expandedId, setExpandedId] = useState<string | number | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const pageRef = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(searchText.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [searchText]);

  const loadPage = useCallback(async (reset = false) => {
    if (reset) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      const colRef = collection(db, 'audit_logs');
      const q = fsQuery(colRef, orderBy('changed_at', 'desc'), fsLimit(100));
      const snap = await getDocs(q);

      let fetchedRows: AuditLogRow[] = snap.docs.map((docSnap, index) => {
        const data = docSnap.data();
        return {
          id: docSnap.id || index,
          event_type: data.event_type || '',
          entity_type: data.entity_type || '',
          entity_id: data.entity_id || null,
          summary: data.summary || '',
          changed_at: data.changed_at || new Date().toISOString(),
          administrative_date: data.administrative_date || null,
          active_shifts: data.active_shifts || null,
          shift_groups: data.shift_groups || null,
          before_data: data.before_data,
          after_data: data.after_data,
        };
      });

      // Filter in memory for responsiveness
      const safeQuery = query.toLowerCase();
      if (safeQuery) {
        fetchedRows = fetchedRows.filter(r => 
          (r.summary && r.summary.toLowerCase().includes(safeQuery)) ||
          (r.entity_id && r.entity_id.toLowerCase().includes(safeQuery)) ||
          (r.event_type && r.event_type.toLowerCase().includes(safeQuery))
        );
      }
      if (category !== 'all') {
        fetchedRows = fetchedRows.filter(r => r.event_type.startsWith(`${category}.`) || r.event_type === category);
      }
      if (shift !== 'all') {
        fetchedRows = fetchedRows.filter(r => r.active_shifts && r.active_shifts.includes(shift));
      }
      if (date) {
        fetchedRows = fetchedRows.filter(r => r.administrative_date === date);
      }

      setError(null);
      setRows(fetchedRows);
      setHasMore(false);
    } catch (fetchError: any) {
      setError(`Gagal membaca riwayat: ${fetchError?.message || String(fetchError)}`);
      if (reset) setRows([]);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
    }
  }, [category, date, query, shift]);

  useEffect(() => {
    pageRef.current = 0;
    setHasMore(true);
    setExpandedId(null);
    void loadPage(true);
  }, [category, date, loadPage, query, shift]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPage(true);
  };

  const hasFilter = Boolean(query || category !== 'all' || shift !== 'all' || date);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-950 p-3 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Riwayat Perubahan
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
                Log audit otomatis dengan konteks shift & grup yang bertugas
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-black text-xs uppercase tracking-wider hover:opacity-90 active:scale-95 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Riwayat</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                placeholder="Cari ringkasan / ID..."
                className="w-full pl-9 pr-3 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Category */}
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">Semua Kategori</option>
              {EVENT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Shift */}
            <select
              value={shift}
              onChange={e => setShift(e.target.value as 'all' | ShiftSlot)}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">Semua Shift</option>
              {SHIFT_OPTIONS.map(s => (
                <option key={s} value={s}>
                  Shift {s}
                </option>
              ))}
            </select>

            {/* Date */}
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {hasFilter && (
            <button
              onClick={() => {
                setSearchText('');
                setQuery('');
                setCategory('all');
                setShift('all');
                setDate('');
              }}
              className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 hover:underline pt-1"
            >
              <X className="w-3 h-3" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 text-xs font-bold flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Content list */}
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Memuat data riwayat...</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 font-bold text-xs uppercase tracking-wider">
            Tidak ada riwayat perubahan yang sesuai
          </div>
        ) : (
          <div className="space-y-2.5">
            {rows.map(row => {
              const cat = categoryFromEvent(row.event_type);
              const colorClass = EVENT_COLORS[cat] || 'bg-slate-600 text-white';
              const isExpanded = expandedId === row.id;

              return (
                <div
                  key={row.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${colorClass}`}>
                        {auditEventLabel(row.event_type)}
                      </span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                        {row.summary}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-slate-400">
                      <Clock3 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatTimestamp(row.changed_at)}</span>
                    </div>
                  </div>

                  {/* Context bar */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                    <div className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3 text-slate-400" />
                      <span>{row.administrative_date || '—'}</span>
                    </div>
                    <span>•</span>
                    <div>
                      <span>Shift: </span>
                      <span className="text-slate-700 dark:text-slate-300 font-black">
                        {row.active_shifts && row.active_shifts.length > 0
                          ? row.active_shifts.join(', ')
                          : '—'}
                      </span>
                    </div>
                    {row.shift_groups && (
                      <>
                        <span>•</span>
                        <div>
                          <span>Grup: </span>
                          <span className="text-slate-700 dark:text-slate-300 font-black">
                            {Object.entries(row.shift_groups)
                              .map(([s, g]) => `${s}:${g}`)
                              .join(' ')}
                          </span>
                        </div>
                      </>
                    )}

                    {(row.before_data !== undefined || row.after_data !== undefined) && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : row.id)}
                        className="ml-auto text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                      >
                        <span>{isExpanded ? 'Tutup Detail' : 'Lihat Detail'}</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>

                  {/* Expanded JSON diff view */}
                  {isExpanded && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-x-auto">
                        <div className="font-black text-slate-400 uppercase tracking-wider mb-1">Sebelum:</div>
                        <pre className="font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                          {formatValue(row.before_data)}
                        </pre>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-x-auto">
                        <div className="font-black text-slate-400 uppercase tracking-wider mb-1">Sesudah:</div>
                        <pre className="font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                          {formatValue(row.after_data)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
