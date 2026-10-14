import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import {
  CalendarDays, CalendarRange, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Moon, Sun, Sunset, Coffee, Users, RotateCcw, Info, Check, ChevronDown,
  Sparkles, CalendarCheck, Search, Filter, ArrowRight
} from 'lucide-react';
import {
  getShiftAssignment, getShiftGroupsNow, getAdministrativeShiftDate, getGroupDuty, getActiveShifts,
  SHIFT_SLOTS, SHIFT_TIME_LABEL, ALL_SHIFT_GROUPS,
  ShiftGroup, ShiftSlot, ShiftDuty,
} from '../utils/shiftSchedule';
import {
  getHolidayForDate, getHolidaysForYear, IndonesianHoliday, formatIsoDateKey
} from '../utils/indonesianHolidays';

/* Rotasi shift murni hasil hitung dari tanggal jangkar (lihat
   utils/shiftSchedule.ts) — tidak ada data yang perlu disimpan. Karena itu
   halaman ini bisa dibuka untuk tanggal berapa pun, bertahun-tahun ke depan
   maupun ke belakang, tanpa perlu input kalender baru tiap tahun. */

const MIN_YEAR = 2020;
const MAX_YEAR = 2035;

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const DOW = [
  { short: 'Min', full: 'Minggu' },
  { short: 'Sen', full: 'Senin' },
  { short: 'Sel', full: 'Selasa' },
  { short: 'Rab', full: 'Rabu' },
  { short: 'Kam', full: 'Kamis' },
  { short: 'Jum', full: 'Jumat' },
  { short: 'Sab', full: 'Sabtu' },
];
const DOW_MINI = ['M', 'S', 'S', 'R', 'K', 'J', 'S'];

const YEAR_OPTIONS = Array.from(
  { length: MAX_YEAR - MIN_YEAR + 1 },
  (_, index) => ({ value: MIN_YEAR + index, label: String(MIN_YEAR + index) })
);

interface PickerOption {
  value: number;
  label: string;
}

/** Dropdown aplikasi sendiri agar tampilan konsisten di semua browser. */
const CustomDropdown: React.FC<{
  value: number;
  options: PickerOption[];
  onChange: (value: number) => void;
  ariaLabel: string;
  widthClassName: string;
}> = ({ value, options, onChange, ariaLabel, widthClassName }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const selected = options.find(option => option.value === value);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      listRef.current
        ?.querySelector<HTMLElement>('[data-selected="true"]')
        ?.scrollIntoView({ block: 'nearest' });
    });
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${widthClassName}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(current => !current)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-700 outline-none transition hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-rose-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        <span className="truncate tabular-nums">{selected?.label ?? value}</span>
        <ChevronDown aria-hidden="true" className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          ref={listRef}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 top-[calc(100%+6px)] z-[60] max-h-72 w-full min-w-max overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        >
          {options.map(option => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                data-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-4 rounded-lg px-3 py-2 text-left text-xs font-black uppercase tracking-wide tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-rose-400 ${
                  isSelected
                    ? 'bg-rose-500 text-white'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {option.label}
                <Check aria-hidden="true" className={`h-3.5 w-3.5 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* Warna grup dibuat sama dengan kartu shift di header dan sub-menu sidebar,
   supaya satu grup selalu punya warna yang sama di seluruh aplikasi. */
const GROUP_SOLID: Record<ShiftGroup, string> = {
  A: 'bg-blue-600 text-white',
  B: 'bg-emerald-600 text-white',
  C: 'bg-purple-600 text-white',
  D: 'bg-amber-500 text-slate-950',
};
const GROUP_DOT: Record<ShiftGroup, string> = {
  A: 'bg-blue-600',
  B: 'bg-emerald-600',
  C: 'bg-purple-600',
  D: 'bg-amber-500',
};
const GROUP_RING: Record<ShiftGroup, string> = {
  A: 'ring-blue-400',
  B: 'ring-emerald-400',
  C: 'ring-purple-400',
  D: 'ring-amber-300',
};

interface DutyMeta {
  label: string;
  /** Label ringkas untuk sel kalender tahunan yang sempit. */
  short: string;
  cell: string;
  Icon: React.ComponentType<{ className?: string }>;
}

/* Warna di sini menandai JENIS shift (bukan grup), dipakai saat satu grup
   difokuskan sehingga tiap sel hanya perlu satu warna. */
const DUTY: Record<ShiftDuty, DutyMeta> = {
  I: {
    label: 'Shift I', short: 'I', Icon: Moon,
    cell: 'bg-indigo-600 text-white border-indigo-700',
  },
  II: {
    label: 'Shift II', short: 'II', Icon: Sun,
    cell: 'bg-sky-400 text-slate-950 border-sky-500',
  },
  III: {
    label: 'Shift III', short: 'III', Icon: Sunset,
    cell: 'bg-orange-500 text-slate-950 border-orange-600',
  },
  off: {
    label: 'Libur', short: 'LIBUR', Icon: Coffee,
    cell: 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700',
  },
};

const DUTY_ORDER: ShiftDuty[] = ['I', 'II', 'III', 'off'];

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Sel satu bulan, sudah dipadatkan dengan sel kosong agar rapat 7 kolom. */
const buildMonthCells = (year: number, month: number): (Date | null)[] => {
  const lead = new Date(year, month, 1).getDay();
  const total = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array(lead).fill(null);
  for (let d = 1; d <= total; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
};

const daysOfMonth = (year: number, month: number): Date[] => {
  const total = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: total }, (_, i) => new Date(year, month, i + 1));
};

const daysOfYear = (year: number): Date[] => {
  const out: Date[] = [];
  for (let m = 0; m < 12; m++) out.push(...daysOfMonth(year, m));
  return out;
};

/** Jumlah hari tiap jenis tugas untuk satu grup pada rentang tanggal. */
const countDuties = (dates: Date[], group: ShiftGroup): Record<ShiftDuty, number> => {
  const acc: Record<ShiftDuty, number> = { I: 0, II: 0, III: 0, off: 0 };
  for (const d of dates) acc[getGroupDuty(group, d)]++;
  return acc;
};

const clampYear = (y: number) => Math.min(MAX_YEAR, Math.max(MIN_YEAR, y));

type ViewMode = 'month' | 'year' | 'holidays';

interface JadwalShiftProps {
  /** Waktu berjalan dari App, dipakai untuk menyorot hari & shift aktif. */
  now?: Date;
}

export const JadwalShift: React.FC<JadwalShiftProps> = ({ now: nowProp }) => {
  /* Kalau App tidak mengirim waktu, halaman pakai jamnya sendiri. Cukup
     menit-an: yang berubah hanya sorotan hari ini dan shift yang berjalan. */
  const [selfNow, setSelfNow] = useState<Date>(() => new Date());
  useEffect(() => {
    if (nowProp) return;
    const t = setInterval(() => setSelfNow(new Date()), 30000);
    return () => clearInterval(t);
  }, [nowProp]);
  const now = nowProp ?? selfNow;
  const administrativeDate = getAdministrativeShiftDate(now);

  const [viewMode, setViewMode] = useState<ViewMode>(
    () => (localStorage.getItem('shiftViewMode') as ViewMode) || 'month'
  );
  const [focusGroup, setFocusGroup] = useState<ShiftGroup | null>(() => {
    const saved = localStorage.getItem('shiftFocusGroup');
    return saved && (ALL_SHIFT_GROUPS as string[]).includes(saved) ? (saved as ShiftGroup) : null;
  });
  const [year, setYear] = useState(() => administrativeDate.getFullYear());
  const [month, setMonth] = useState(() => administrativeDate.getMonth());

  // State untuk filter daftar hari libur
  const [holidayFilter, setHolidayFilter] = useState<'all' | 'national' | 'joint_leave' | 'asahi'>('all');
  const [holidaySearchQuery, setHolidaySearchQuery] = useState('');

  useEffect(() => localStorage.setItem('shiftViewMode', viewMode), [viewMode]);
  useEffect(() => {
    if (focusGroup) localStorage.setItem('shiftFocusGroup', focusGroup);
    else localStorage.removeItem('shiftFocusGroup');
  }, [focusGroup]);

  /* Panel "Hari Ini" mengikuti tanggal administratif, termasuk grup libur.
     Shift I tanggal berikutnya masuk pukul 22:45 untuk serah terima. */
  const todayGroups = getShiftGroupsNow(now);
  const todayOff = getShiftAssignment(administrativeDate).off;
  const activeSlots = getActiveShifts(now);
  const todayHoliday = getHolidayForDate(administrativeDate);

  const shiftMonth = useCallback((delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(clampYear(d.getFullYear()));
    setMonth(d.getMonth());
  }, [year, month]);

  const shiftYear = useCallback((delta: number) => setYear(y => clampYear(y + delta)), []);

  const goToday = useCallback(() => {
    const t = getAdministrativeShiftDate(new Date());
    setYear(t.getFullYear());
    setMonth(t.getMonth());
  }, []);

  const monthCells = useMemo(() => buildMonthCells(year, month), [year, month]);
  const statDates = useMemo(
    () => (viewMode === 'year' ? daysOfYear(year) : daysOfMonth(year, month)),
    [viewMode, year, month]
  );
  const stats = useMemo(
    () => ALL_SHIFT_GROUPS.map(g => ({ group: g, counts: countDuties(statDates, g) })),
    [statDates]
  );

  const periodLabel = viewMode === 'year' ? `Tahun ${year}` : `${MONTHS[month]} ${year}`;

  // Data libur untuk tahun yang sedang aktif
  const currentYearHolidays = useMemo(() => getHolidaysForYear(year), [year]);
  const countNationalHolidays = useMemo(() => currentYearHolidays.filter(h => h.type === 'national').length, [currentYearHolidays]);
  const countJointLeaves = useMemo(() => currentYearHolidays.filter(h => h.type === 'joint_leave').length, [currentYearHolidays]);
  const countAsahiHolidays = useMemo(() => currentYearHolidays.filter(h => h.type === 'asahi' || h.type === 'company').length, [currentYearHolidays]);

  // Lompat langsung ke bulan dan tanggal tertentu
  const jumpToHolidayDate = useCallback((holidayDateStr: string) => {
    const [y, m] = holidayDateStr.split('-').map(Number);
    setYear(y);
    setMonth(m - 1);
    setViewMode('month');
  }, []);

  /* ---------------------------------------------------------------- */

  const GroupChip: React.FC<{ group: ShiftGroup | null }> = ({ group }) => {
    const isActive = focusGroup === group;
    return (
      <button
        type="button"
        onClick={() => setFocusGroup(group)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-[background-color,color,box-shadow,transform] active:scale-95 cursor-pointer ${
          isActive
            ? group
              ? `${GROUP_SOLID[group]} ring-2 ${GROUP_RING[group]} shadow-sm`
              : 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 ring-2 ring-slate-400 shadow-sm'
            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
        }`}
      >
        {group ? (
          <span className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-white/90' : GROUP_DOT[group]}`} />
        ) : (
          <Users className="w-3.5 h-3.5 shrink-0" />
        )}
        {group ? `Grup ${group}` : 'Semua Grup'}
      </button>
    );
  };

  /** Satu sel tanggal pada tampilan bulan dengan indikator Libur Nasional / Cuti Bersama. */
  const MonthCell: React.FC<{ date: Date | null }> = ({ date }) => {
    if (!date) return <div className="rounded-xl bg-transparent" />;

    const isToday = isSameDay(date, administrativeDate);
    const assignment = getShiftAssignment(date);
    const isSunday = date.getDay() === 0;
    const holiday = getHolidayForDate(date);
    const isRedDate = isSunday || (holiday && (holiday.type === 'national' || holiday.type === 'asahi' || holiday.type === 'company'));

    /* Satu grup difokuskan: seluruh sel diwarnai jenis shift hari itu. */
    if (focusGroup) {
      const duty = getGroupDuty(focusGroup, date);
      const meta = DUTY[duty];
      return (
        <div
          className={`relative rounded-xl border p-2 min-h-[88px] flex flex-col justify-between transition-shadow ${meta.cell} ${
            isToday ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white dark:ring-offset-slate-950 shadow-lg' : ''
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className={`text-lg sm:text-xl font-black leading-none tabular-nums ${isRedDate ? 'text-rose-300 drop-shadow-sm' : ''}`}>
              {date.getDate()}
            </span>
            <div className="flex items-center gap-1">
              {holiday && (
                <span
                  title={`${holiday.name} (${holiday.type === 'national' ? 'Libur Nasional' : holiday.type === 'joint_leave' ? 'Cuti Bersama' : 'Libur Asahi'})`}
                  className={`text-[8px] font-black uppercase px-1 py-0.5 rounded leading-none ${
                    holiday.type === 'national'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : holiday.type === 'joint_leave'
                        ? 'bg-amber-400 text-amber-950'
                        : 'bg-emerald-500 text-white shadow-sm'
                  }`}
                >
                  {holiday.type === 'national' ? 'LIBUR' : holiday.type === 'joint_leave' ? 'CUTI' : 'ASAHI'}
                </span>
              )}
              <meta.Icon className="w-3.5 h-3.5 opacity-80" />
            </div>
          </div>

          {holiday && (
            <div
              className={`text-[8px] sm:text-[9px] font-black leading-tight truncate px-1 py-0.5 rounded my-0.5 ${
                holiday.type === 'national'
                  ? 'bg-rose-950/80 text-rose-200 border border-rose-500/40'
                  : holiday.type === 'joint_leave'
                    ? 'bg-amber-950/80 text-amber-200 border border-amber-500/40'
                    : 'bg-emerald-950/80 text-emerald-200 border border-emerald-500/40'
              }`}
              title={`${holiday.name} (${holiday.type === 'national' ? 'Libur Nasional' : holiday.type === 'joint_leave' ? 'Cuti Bersama' : 'Libur Asahi'})`}
            >
              {holiday.name}
            </div>
          )}

          <div className="flex flex-col items-center justify-center text-center">
            <div className="text-sm sm:text-base font-black uppercase tracking-wide leading-none">
              {meta.label}
            </div>
            {duty !== 'off' && (
              <div className="text-[10px] sm:text-xs font-extrabold tracking-wide opacity-85 leading-none mt-1">
                {SHIFT_TIME_LABEL[duty]}
              </div>
            )}
          </div>
        </div>
      );
    }

    /* Tanpa fokus: tampilkan keempat grup — tiga shift plus yang libur. */
    return (
      <div
        className={`relative rounded-xl border p-1.5 min-h-[86px] flex flex-col justify-between transition-colors ${
          isToday
            ? 'border-slate-900 dark:border-white ring-2 ring-slate-900 dark:ring-white shadow-lg bg-white dark:bg-slate-900'
            : holiday
              ? holiday.type === 'national'
                ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20'
                : holiday.type === 'joint_leave'
                  ? 'border-amber-300 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20'
                  : 'border-emerald-300 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
        }`}
      >
        <div className="flex items-center justify-between gap-1 px-0.5">
          <div className="flex items-center gap-1 min-w-0">
            <span className={`text-xs font-black leading-none tabular-nums ${
              isToday
                ? 'text-slate-900 dark:text-white'
                : isRedDate
                  ? 'text-rose-600 dark:text-rose-400 font-black'
                  : holiday?.type === 'joint_leave'
                    ? 'text-amber-600 dark:text-amber-400 font-black'
                    : 'text-slate-600 dark:text-slate-400'
            }`}>
              {date.getDate()}
            </span>
            {holiday && (
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  holiday.type === 'national'
                    ? 'bg-rose-500'
                    : holiday.type === 'joint_leave'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                }`}
                title={`${holiday.name} (${holiday.type === 'national' ? 'Libur Nasional' : holiday.type === 'joint_leave' ? 'Cuti Bersama' : 'Libur Asahi'})`}
              />
            )}
          </div>
          <span className="flex items-center gap-0.5 text-[8px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0">
            <Coffee className="w-2.5 h-2.5" />{assignment.off}
          </span>
        </div>

        {holiday && (
          <div
            className={`text-[8px] leading-tight font-black truncate px-1 py-0.5 rounded my-0.5 ${
              holiday.type === 'national'
                ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                : holiday.type === 'joint_leave'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
            }`}
            title={`${holiday.name} (${holiday.type === 'national' ? 'Libur Nasional' : holiday.type === 'joint_leave' ? 'Cuti Bersama' : 'Libur Asahi'})`}
          >
            {holiday.name}
          </div>
        )}

        <div className="flex flex-col gap-0.5 mt-auto">
          {SHIFT_SLOTS.map(slot => {
            const isLive = isToday && activeSlots.includes(slot);
            return (
              <div key={slot} className="flex items-stretch gap-1 leading-none">
                <span className={`w-6 shrink-0 flex items-center justify-center rounded text-[9px] font-black ${
                  isLive
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                }`}>
                  {slot}
                </span>
                <span className={`flex-1 flex items-center justify-center py-1 rounded text-[10px] font-black uppercase tracking-wider ${GROUP_SOLID[assignment[slot]]} ${
                  isToday && !isLive ? 'opacity-45' : ''
                }`}>
                  {assignment[slot]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /** Kalender kecil satu bulan, dipakai pada tampilan tahun. */
  const MiniMonth: React.FC<{ monthIndex: number }> = ({ monthIndex }) => {
    const cells = buildMonthCells(year, monthIndex);
    const isCurrentMonth = administrativeDate.getFullYear() === year && administrativeDate.getMonth() === monthIndex;

    return (
      <div className={`rounded-2xl border p-2.5 bg-white dark:bg-slate-900 ${
        isCurrentMonth
          ? 'border-slate-900 dark:border-white shadow-md'
          : 'border-slate-200 dark:border-slate-800'
      }`}>
        <button
          type="button"
          onClick={() => { setMonth(monthIndex); setViewMode('month'); }}
          title={`Buka ${MONTHS[monthIndex]} ${year}`}
          className="w-full mb-2 px-1.5 py-1 rounded-lg text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left flex items-center justify-between"
        >
          <span>{MONTHS[monthIndex]}</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 opacity-60" />
        </button>

        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {DOW_MINI.map((d, i) => (
            <span key={i} className={`text-center text-[11px] font-black uppercase ${
              i === 0 ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'
            }`}>
              {d}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((date, i) => {
            if (!date) return <span key={i} />;
            const isToday = isSameDay(date, administrativeDate);
            const holiday = getHolidayForDate(date);
            const isRedDate = date.getDay() === 0 || (holiday && (holiday.type === 'national' || holiday.type === 'asahi' || holiday.type === 'company'));

            if (focusGroup) {
              const meta = DUTY[getGroupDuty(focusGroup, date)];
              return (
                <span
                  key={i}
                  title={`${date.getDate()} ${MONTHS_SHORT[monthIndex]} ${year} — ${holiday ? `[${holiday.name}] ` : ''}${meta.label}`}
                  className={`relative flex flex-col items-center justify-center gap-1 py-1.5 rounded-md border ${meta.cell} ${
                    isToday ? 'ring-2 ring-slate-900 dark:ring-white' : ''
                  }`}
                >
                  <span className={`text-xs font-black leading-none ${isRedDate ? 'text-rose-200 underline decoration-rose-400' : ''}`}>
                    {date.getDate()}
                  </span>
                  <span className="text-[10px] font-black leading-none tracking-tight opacity-90">{meta.short}</span>
                  {holiday && (
                    <span
                      className={`absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full ${
                        holiday.type === 'national' 
                          ? 'bg-rose-300' 
                          : holiday.type === 'joint_leave' 
                            ? 'bg-amber-300' 
                            : 'bg-emerald-300'
                      }`}
                    />
                  )}
                </span>
              );
            }

            /* Tanpa fokus grup, tiga kotak di bawah tanggal adalah grup
               pemegang Shift I, II, III berurutan dari kiri. */
            const a = getShiftAssignment(date);
            return (
              <span
                key={i}
                title={`${date.getDate()} ${MONTHS_SHORT[monthIndex]} ${year} — ${holiday ? `[${holiday.name}] ` : ''}I: ${a.I}, II: ${a.II}, III: ${a.III}, Libur: ${a.off}`}
                className={`relative flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-md border ${
                  isToday
                    ? 'border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-800'
                    : holiday
                      ? holiday.type === 'national'
                        ? 'border-rose-300/80 bg-rose-50/50 dark:bg-rose-950/30 dark:border-rose-800/80'
                        : holiday.type === 'joint_leave'
                          ? 'border-amber-300/80 bg-amber-50/50 dark:bg-amber-950/30 dark:border-amber-800/80'
                          : 'border-emerald-300/80 bg-emerald-50/50 dark:bg-emerald-950/30 dark:border-emerald-800/80'
                      : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-0.5">
                  <span className={`text-xs font-black leading-none tabular-nums ${
                    isRedDate
                      ? 'text-rose-600 dark:text-rose-400'
                      : holiday?.type === 'joint_leave'
                        ? 'text-amber-600 dark:text-amber-400'
                        : holiday?.type === 'asahi' || holiday?.type === 'company'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-600 dark:text-slate-300'
                  }`}>
                    {date.getDate()}
                  </span>
                  {holiday && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        holiday.type === 'national' 
                          ? 'bg-rose-500' 
                          : holiday.type === 'joint_leave' 
                            ? 'bg-amber-500' 
                            : 'bg-emerald-500'
                      }`}
                    />
                  )}
                </div>
                <span className="flex w-full gap-px">
                  {SHIFT_SLOTS.map(slot => (
                    <span
                      key={slot}
                      className={`flex-1 py-0.5 rounded-sm text-[10px] font-black leading-none text-center ${GROUP_SOLID[a[slot]]}`}
                    >
                      {a[slot]}
                    </span>
                  ))}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  /** Tampilan Daftar Hari Libur Nasional & Cuti Bersama SKB 3 Menteri */
  const HolidaysView: React.FC = () => {
    const filteredHolidays = useMemo(() => {
      let list = currentYearHolidays;
      if (holidayFilter === 'national') list = list.filter(h => h.type === 'national');
      if (holidayFilter === 'joint_leave') list = list.filter(h => h.type === 'joint_leave');
      if (holidayFilter === 'asahi') list = list.filter(h => h.type === 'asahi' || h.type === 'company');
      if (holidaySearchQuery.trim()) {
        const q = holidaySearchQuery.toLowerCase();
        list = list.filter(h => h.name.toLowerCase().includes(q) || h.date.includes(q));
      }
      return list;
    }, [currentYearHolidays, holidayFilter, holidaySearchQuery]);

    return (
      <div className="flex flex-col gap-4">
        {/* Banner Penjelasan Resmi SKB 3 Menteri & Libur Asahi */}
        <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-white font-black text-xs uppercase tracking-wider backdrop-blur-sm">
                SKB 3 Menteri & Libur Asahi
              </span>
              <span className="text-white/80 font-bold text-xs">
                Tahun {year}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">
              Kalender Libur Nasional, Cuti Bersama & Libur Asahi {year}
            </h3>
            <p className="text-xs sm:text-sm text-white/90 font-medium max-w-2xl">
              Sinkronisasi otomatis dengan giliran kerja 4 regu (A/B/C/D). Memudahkan monitoring shift operasional saat tanggal merah dan libur akhir tahun Asahi.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 shrink-0 flex-wrap">
            <div className="text-center px-2">
              <div className="text-2xl sm:text-3xl font-black tabular-nums">{countNationalHolidays}</div>
              <div className="text-[10px] uppercase font-bold text-white/80">Libur Nasional</div>
            </div>
            <div className="w-px h-8 bg-white/30" />
            <div className="text-center px-2">
              <div className="text-2xl sm:text-3xl font-black tabular-nums">{countJointLeaves}</div>
              <div className="text-[10px] uppercase font-bold text-white/80">Cuti Bersama</div>
            </div>
            {countAsahiHolidays > 0 && (
              <>
                <div className="w-px h-8 bg-white/30" />
                <div className="text-center px-2">
                  <div className="text-2xl sm:text-3xl font-black tabular-nums">{countAsahiHolidays}</div>
                  <div className="text-[10px] uppercase font-bold text-white/80">Libur Asahi</div>
                </div>
              </>
            )}
            <div className="w-px h-8 bg-white/30" />
            <div className="text-center px-2">
              <div className="text-2xl sm:text-3xl font-black tabular-nums">{currentYearHolidays.length}</div>
              <div className="text-[10px] uppercase font-bold text-white/80">Total Hari</div>
            </div>
          </div>
        </div>

        {/* Filter & Kontrol Pencarian */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setHolidayFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shrink-0 ${
                holidayFilter === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Semua ({currentYearHolidays.length})
            </button>
            <button
              type="button"
              onClick={() => setHolidayFilter('national')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shrink-0 ${
                holidayFilter === 'national'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 border border-rose-200 dark:border-rose-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Libur Nasional ({countNationalHolidays})
            </button>
            <button
              type="button"
              onClick={() => setHolidayFilter('joint_leave')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shrink-0 ${
                holidayFilter === 'joint_leave'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Cuti Bersama ({countJointLeaves})
            </button>
            {countAsahiHolidays > 0 && (
              <button
                type="button"
                onClick={() => setHolidayFilter('asahi')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shrink-0 ${
                  holidayFilter === 'asahi'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Libur Asahi ({countAsahiHolidays})
              </button>
            )}
          </div>

          <div className="relative min-w-[200px] sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={holidaySearchQuery}
              onChange={e => setHolidaySearchQuery(e.target.value)}
              placeholder="Cari hari libur..."
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
        </div>

        {/* Tabel / Grid Kartu Hari Libur */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredHolidays.map((holiday) => {
            const [hy, hm, hd] = holiday.date.split('-').map(Number);
            const holidayDate = new Date(hy, hm - 1, hd);
            const assignment = getShiftAssignment(holidayDate);
            const isNational = holiday.type === 'national';
            const isJointLeave = holiday.type === 'joint_leave';

            // Status grup yang difokuskan pada hari libur ini
            const focusDuty = focusGroup ? getGroupDuty(focusGroup, holidayDate) : null;

            return (
              <div
                key={holiday.date}
                className={`rounded-2xl border p-4 shadow-sm bg-white dark:bg-slate-900 transition-all hover:shadow-md flex flex-col justify-between gap-3 ${
                  isNational
                    ? 'border-rose-200 dark:border-rose-900/50'
                    : isJointLeave
                      ? 'border-amber-200 dark:border-amber-900/50'
                      : 'border-emerald-200 dark:border-emerald-900/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isNational
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                        : isJointLeave
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    }`}>
                      {isNational ? 'Libur Nasional' : isJointLeave ? 'Cuti Bersama' : 'Libur Asahi'}
                    </span>

                    <button
                      type="button"
                      onClick={() => jumpToHolidayDate(holiday.date)}
                      className="flex items-center gap-1 text-[11px] font-black text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                    >
                      <span>Lihat di Kalender</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h4 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                    {holiday.name}
                  </h4>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                    {holidayDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>

                {/* Highlight Status Grup Tertentu jika sedang difokuskan */}
                {focusGroup && focusDuty && (
                  <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold ${
                    focusDuty === 'off'
                      ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                  }`}>
                    <span>Status <strong>Grup {focusGroup}</strong>:</span>
                    <span className="font-black uppercase tracking-wider">
                      {focusDuty === 'off' ? '☕ Libur Rutin' : `⚡ Masuk ${DUTY[focusDuty].label} (${SHIFT_TIME_LABEL[focusDuty]})`}
                    </span>
                  </div>
                )}

                {/* Penugasan 4 Grup pada Hari Libur Ini */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
                    Sinkronisasi Tugas Shift:
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 text-center">
                    {SHIFT_SLOTS.map(slot => (
                      <div key={slot} className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200 dark:border-slate-700/60">
                        <div className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500">
                          Shift {slot}
                        </div>
                        <div className={`mt-1 py-0.5 rounded text-xs font-black uppercase ${GROUP_SOLID[assignment[slot]]}`}>
                          {assignment[slot]}
                        </div>
                      </div>
                    ))}
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200 dark:border-slate-700/60">
                      <div className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1">
                        <Coffee className="w-2.5 h-2.5" /> Libur
                      </div>
                      <div className={`mt-1 py-0.5 rounded text-xs font-black uppercase ${GROUP_SOLID[assignment.off]}`}>
                        {assignment.off}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredHolidays.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 font-bold bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              Tidak ada hari libur yang cocok dengan pencarian "{holidaySearchQuery}" untuk tahun {year}.
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ---------------------------------------------------------------- */

  return (
    <div className="w-full flex flex-col gap-4 p-2 md:p-4 bg-slate-100 dark:bg-slate-950 rounded-2xl text-slate-900 dark:text-slate-100">

      {/* Header, navigasi periode, dan filter grup dalam satu kartu. */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-visible">
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2.5 bg-rose-500/20 text-rose-500 rounded-xl border border-rose-500/40 shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-black tracking-wide uppercase">
                  Jadwal Shift & Kalender Libur
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                  <Sparkles className="w-3 h-3 text-rose-500" /> SKB 3 Menteri & Libur Asahi
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Pilih tampilan: Bulan, Tahun, atau Daftar Libur Resmi */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              {([
                ['month', 'Bulan', CalendarDays],
                ['year', 'Tahun', CalendarRange],
                ['holidays', `Libur ${year}`, CalendarCheck]
              ] as const).map(([mode, label, Icon]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-[background-color,color,box-shadow] cursor-pointer ${
                    viewMode === mode
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />{label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={goToday}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-700 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-sm transition-[background-color,transform] active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Hari Ini
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 px-3.5 py-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => shiftYear(-1)}
              title="Tahun sebelumnya"
              aria-label="Tahun sebelumnya"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-400"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            {viewMode === 'month' && (
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                title="Bulan sebelumnya"
                aria-label="Bulan sebelumnya"
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-400"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {viewMode === 'month' && (
              <CustomDropdown
                value={month}
                options={MONTHS.map((label, value) => ({ value, label }))}
                onChange={setMonth}
                ariaLabel="Pilih bulan"
                widthClassName="w-36"
              />
            )}

            <CustomDropdown
              value={year}
              options={YEAR_OPTIONS}
              onChange={setYear}
              ariaLabel="Pilih tahun"
              widthClassName="w-28"
            />

            {viewMode === 'month' && (
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                title="Bulan berikutnya"
                aria-label="Bulan berikutnya"
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-400"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => shiftYear(1)}
              title="Tahun berikutnya"
              aria-label="Tahun berikutnya"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-400"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>

          {/* Fokus grup */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <GroupChip group={null} />
            {ALL_SHIFT_GROUPS.map(g => <GroupChip key={g} group={g} />)}
          </div>
        </div>
      </div>

      {/* Konten Utama Terpilih */}
      {viewMode === 'holidays' ? (
        <HolidaysView />
      ) : viewMode === 'month' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-3 overflow-x-auto">
          <div className="min-w-[680px]">
            <div className="grid grid-cols-7 gap-1.5 mb-1.5">
              {DOW.map((d, i) => (
                <div
                  key={d.full}
                  className={`py-1.5 text-center text-[10px] md:text-xs font-black uppercase tracking-widest rounded-lg bg-slate-100 dark:bg-slate-800 ${
                    i === 0 ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <span className="md:hidden">{d.short}</span>
                  <span className="hidden md:inline">{d.full}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {monthCells.map((date, i) => <MonthCell key={i} date={date} />)}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-3">
          {MONTHS.map((_, i) => <MiniMonth key={i} monthIndex={i} />)}
        </div>
      )}

      {/* Ringkasan hari ini & status libur nasional */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="hidden lg:flex lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex-col">
          <div className="shrink-0 px-3.5 py-2 bg-slate-100 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-3.5 h-3.5 text-rose-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                Hari Ini — {administrativeDate.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>

            {todayHoliday ? (
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                todayHoliday.type === 'national'
                  ? 'bg-rose-500 text-white'
                  : 'bg-amber-400 text-amber-950'
              }`}>
                🎉 {todayHoliday.name} ({todayHoliday.type === 'national' ? 'Libur Nasional' : 'Cuti Bersama'})
              </span>
            ) : (
              <span className="text-[10px] font-bold text-slate-400">
                Hari Kerja Standar
              </span>
            )}
          </div>
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4">
            {SHIFT_SLOTS.map((slot, i) => {
              const isLive = activeSlots.includes(slot);
              const meta = DUTY[slot];
              return (
                <div key={slot} className={`p-3 flex flex-col justify-center gap-1.5 ${i > 0 ? 'sm:border-l border-slate-200 dark:border-slate-800' : ''} ${i >= 2 ? 'border-t sm:border-t-0 border-slate-200 dark:border-slate-800' : ''} ${i === 1 ? 'border-l sm:border-l border-slate-200 dark:border-slate-800' : ''}`}>
                  <div className="flex items-center justify-center gap-1.5">
                    <meta.Icon className={`w-3.5 h-3.5 ${isLive ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                      isLive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                    }`}>
                      Shift {slot}
                    </span>
                  </div>
                  <span className={`px-2 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider text-center ${GROUP_SOLID[todayGroups[slot]]} ${isLive ? '' : 'opacity-45'}`}>
                    Grup {todayGroups[slot]}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 tracking-wide text-center">
                    {SHIFT_TIME_LABEL[slot]}
                  </span>
                </div>
              );
            })}
            <div className="p-3 flex flex-col justify-center gap-1.5 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-center gap-1.5">
                <Coffee className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Libur</span>
              </div>
              <span className={`px-2 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider text-center opacity-45 ${GROUP_SOLID[todayOff]}`}>
                Grup {todayOff}
              </span>
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 tracking-wide text-center">Off duty</span>
            </div>
          </div>
        </div>

        {/* Rekap periode */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-rose-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                Rekap {periodLabel} ({statDates.length} hari)
              </span>
            </div>
            {viewMode !== 'holidays' && (
              <button
                type="button"
                onClick={() => setViewMode('holidays')}
                className="text-[10px] font-black text-rose-600 dark:text-rose-400 hover:underline"
              >
                Lihat Libur {year}
              </button>
            )}
          </div>
          <table className="w-full text-[10px]">
            <thead>
              <tr className="text-slate-400 dark:text-slate-500">
                <th className="px-2.5 py-1.5 text-left font-black uppercase tracking-wider">Grup</th>
                {DUTY_ORDER.map(d => (
                  <th key={d} className="px-1 py-1.5 text-center font-black uppercase tracking-wider">
                    {d === 'off' ? 'Libur' : d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.map(({ group, counts }) => (
                <tr
                  key={group}
                  className={`border-t border-slate-200 dark:border-slate-800 ${
                    focusGroup === group ? 'bg-slate-100 dark:bg-slate-800/70' : ''
                  }`}
                >
                  <td className="px-2.5 py-1.5">
                    <span className="flex items-center gap-1.5 font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${GROUP_DOT[group]}`} />
                      {group}
                    </span>
                  </td>
                  {DUTY_ORDER.map(d => (
                    <td key={d} className="px-1 py-1.5 text-center font-black text-slate-600 dark:text-slate-300 tabular-nums">
                      {counts[d]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
