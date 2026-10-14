/**
 * Kalender Hari Libur Nasional & Cuti Bersama Pemerintah Republik Indonesia
 * Berdasarkan SKB 3 Menteri (Menteri Agama, Menteri Ketenagakerjaan, dan MenPAN-RB).
 *
 * Mencakup data resmi lengkap tahun 2027 dan 2026 untuk sinkronisasi jadwal operasional dan shift kerja.
 */

export type HolidayType = 'national' | 'joint_leave' | 'asahi' | 'company';

export interface IndonesianHoliday {
  date: string; // format 'YYYY-MM-DD'
  name: string;
  type: HolidayType;
  description?: string;
}

export const INDONESIAN_HOLIDAYS_2027: IndonesianHoliday[] = [
  // --- Januari 2027 ---
  {
    date: '2027-01-01',
    name: 'Tahun Baru 2027 Masehi',
    type: 'national',
  },
  {
    date: '2027-01-05',
    name: 'Isra Mikraj Nabi Muhammad SAW',
    type: 'national',
  },

  // --- Februari 2027 ---
  {
    date: '2027-02-05',
    name: 'Cuti Bersama Tahun Baru Imlek 2578 Kongzili',
    type: 'joint_leave',
  },
  {
    date: '2027-02-06',
    name: 'Tahun Baru Imlek 2578 Kongzili',
    type: 'national',
  },

  // --- Maret 2027 ---
  {
    date: '2027-03-08',
    name: 'Hari Suci Nyepi (Tahun Baru Saka 1949)',
    type: 'national',
  },
  {
    date: '2027-03-09',
    name: 'Cuti Bersama Hari Raya Idulfitri 1448 H',
    type: 'joint_leave',
  },
  {
    date: '2027-03-10',
    name: 'Hari Raya Idulfitri 1448 Hijriah',
    type: 'national',
  },
  {
    date: '2027-03-11',
    name: 'Hari Raya Idulfitri 1448 Hijriah',
    type: 'national',
  },
  {
    date: '2027-03-12',
    name: 'Cuti Bersama Hari Raya Idulfitri 1448 H',
    type: 'joint_leave',
  },
  {
    date: '2027-03-15',
    name: 'Cuti Bersama Hari Raya Idulfitri 1448 H',
    type: 'joint_leave',
  },
  {
    date: '2027-03-25',
    name: 'Cuti Bersama Wafat Yesus Kristus',
    type: 'joint_leave',
  },
  {
    date: '2027-03-26',
    name: 'Wafat Yesus Kristus (Jumat Agung)',
    type: 'national',
  },
  {
    date: '2027-03-28',
    name: 'Hari Kebangkitan Yesus Kristus (Paskah)',
    type: 'national',
  },

  // --- Mei 2027 ---
  {
    date: '2027-05-01',
    name: 'Hari Buruh Internasional',
    type: 'national',
  },
  {
    date: '2027-05-06',
    name: 'Kenaikan Yesus Kristus',
    type: 'national',
  },
  {
    date: '2027-05-17',
    name: 'Hari Raya Iduladha 1448 Hijriah',
    type: 'national',
  },
  {
    date: '2027-05-18',
    name: 'Cuti Bersama Hari Raya Iduladha 1448 H',
    type: 'joint_leave',
  },
  {
    date: '2027-05-19',
    name: 'Cuti Bersama Hari Raya Waisak 2571 BE',
    type: 'joint_leave',
  },
  {
    date: '2027-05-20',
    name: 'Hari Raya Waisak 2571 BE',
    type: 'national',
  },

  // --- Juni 2027 ---
  {
    date: '2027-06-01',
    name: 'Hari Lahir Pancasila',
    type: 'national',
  },
  {
    date: '2027-06-06',
    name: '1 Muharam Tahun Baru Islam 1449 Hijriah',
    type: 'national',
  },

  // --- Agustus 2027 ---
  {
    date: '2027-08-15',
    name: 'Maulid Nabi Muhammad SAW',
    type: 'national',
  },
  {
    date: '2027-08-17',
    name: 'Proklamasi Kemerdekaan RI (HUT RI ke-82)',
    type: 'national',
  },

  // --- Desember 2027 ---
  {
    date: '2027-12-24',
    name: 'Cuti Bersama Kelahiran Yesus Kristus (Natal)',
    type: 'joint_leave',
  },
  {
    date: '2027-12-25',
    name: 'Kelahiran Yesus Kristus (Hari Raya Natal)',
    type: 'national',
  },
  {
    date: '2027-12-26',
    name: 'Isra Mikraj Nabi Muhammad SAW 1449 H',
    type: 'national',
  },
  {
    date: '2027-12-31',
    name: 'Libur Asahi',
    type: 'asahi',
    description: 'Hari Libur Asahi (Akhir Tahun)',
  },
];

export const INDONESIAN_HOLIDAYS_2026: IndonesianHoliday[] = [
  // --- Januari 2026 ---
  {
    date: '2026-01-01',
    name: 'Tahun Baru 2026 Masehi',
    type: 'national',
  },
  {
    date: '2026-01-16',
    name: 'Isra Mikraj Nabi Muhammad SAW',
    type: 'national',
  },

  // --- Februari 2026 ---
  {
    date: '2026-02-16',
    name: 'Cuti Bersama Tahun Baru Imlek 2577 Kongzili',
    type: 'joint_leave',
  },
  {
    date: '2026-02-17',
    name: 'Tahun Baru Imlek 2577 Kongzili',
    type: 'national',
  },

  // --- Maret 2026 ---
  {
    date: '2026-03-18',
    name: 'Cuti Bersama Hari Suci Nyepi 1948',
    type: 'joint_leave',
  },
  {
    date: '2026-03-19',
    name: 'Hari Suci Nyepi (Tahun Baru Saka 1948)',
    type: 'national',
  },
  {
    date: '2026-03-20',
    name: 'Cuti Bersama Hari Raya Idulfitri 1447 H',
    type: 'joint_leave',
  },
  {
    date: '2026-03-21',
    name: 'Hari Raya Idulfitri 1447 Hijriah',
    type: 'national',
  },
  {
    date: '2026-03-22',
    name: 'Hari Raya Idulfitri 1447 Hijriah',
    type: 'national',
  },
  {
    date: '2026-03-23',
    name: 'Cuti Bersama Hari Raya Idulfitri 1447 H',
    type: 'joint_leave',
  },
  {
    date: '2026-03-24',
    name: 'Cuti Bersama Hari Raya Idulfitri 1447 H',
    type: 'joint_leave',
  },

  // --- April 2026 ---
  {
    date: '2026-04-03',
    name: 'Wafat Yesus Kristus (Jumat Agung)',
    type: 'national',
  },
  {
    date: '2026-04-05',
    name: 'Kebangkitan Yesus Kristus (Paskah)',
    type: 'national',
  },

  // --- Mei 2026 ---
  {
    date: '2026-05-01',
    name: 'Hari Buruh Internasional',
    type: 'national',
  },
  {
    date: '2026-05-14',
    name: 'Kenaikan Yesus Kristus',
    type: 'national',
  },
  {
    date: '2026-05-15',
    name: 'Cuti Bersama Kenaikan Yesus Kristus',
    type: 'joint_leave',
  },
  {
    date: '2026-05-27',
    name: 'Hari Raya Iduladha 1447 Hijriah',
    type: 'national',
  },
  {
    date: '2026-05-28',
    name: 'Cuti Bersama Hari Raya Iduladha 1447 H',
    type: 'joint_leave',
  },
  {
    date: '2026-05-31',
    name: 'Hari Raya Waisak 2570 BE',
    type: 'national',
  },

  // --- Juni 2026 ---
  {
    date: '2026-06-01',
    name: 'Hari Lahir Pancasila',
    type: 'national',
  },
  {
    date: '2026-06-16',
    name: '1 Muharam Tahun Baru Islam 1448 Hijriah',
    type: 'national',
  },

  // --- Agustus 2026 ---
  {
    date: '2026-08-17',
    name: 'Proklamasi Kemerdekaan RI (HUT RI ke-81)',
    type: 'national',
  },
  {
    date: '2026-08-25',
    name: 'Maulid Nabi Muhammad SAW',
    type: 'national',
  },

  // --- Desember 2026 ---
  {
    date: '2026-12-24',
    name: 'Cuti Bersama Kelahiran Yesus Kristus (Natal)',
    type: 'joint_leave',
  },
  {
    date: '2026-12-25',
    name: 'Kelahiran Yesus Kristus (Hari Raya Natal)',
    type: 'national',
  },
  {
    date: '2026-12-31',
    name: 'Libur Asahi',
    type: 'asahi',
    description: 'Hari Libur Asahi (Akhir Tahun)',
  },
];

// Map tahun ke daftar libur
const HOLIDAYS_BY_YEAR: Record<number, IndonesianHoliday[]> = {
  2026: INDONESIAN_HOLIDAYS_2026,
  2027: INDONESIAN_HOLIDAYS_2027,
};

// Map YYYY-MM-DD ke objek libur untuk lookup O(1)
const HOLIDAY_MAP_CACHE = new Map<string, IndonesianHoliday>();
[...INDONESIAN_HOLIDAYS_2026, ...INDONESIAN_HOLIDAYS_2027].forEach(h => {
  HOLIDAY_MAP_CACHE.set(h.date, h);
});

export const formatIsoDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const getHolidaysForYear = (year: number): IndonesianHoliday[] => {
  const base = HOLIDAYS_BY_YEAR[year] ? [...HOLIDAYS_BY_YEAR[year]] : [];
  const asahiKey = `${year}-12-31`;
  if (!base.some(h => h.date === asahiKey)) {
    base.push({
      date: asahiKey,
      name: 'Libur Asahi',
      type: 'asahi',
      description: 'Hari Libur Asahi (Akhir Tahun)',
    });
  }
  return base.sort((a, b) => a.date.localeCompare(b.date));
};

export const getHolidayForDate = (date: Date): IndonesianHoliday | undefined => {
  const key = formatIsoDateKey(date);
  const found = HOLIDAY_MAP_CACHE.get(key);
  if (found) return found;
  // Tanggal 31 Desember selalu merupakan Libur Asahi
  if (date.getMonth() === 11 && date.getDate() === 31) {
    return {
      date: key,
      name: 'Libur Asahi',
      type: 'asahi',
      description: 'Hari Libur Asahi (Akhir Tahun)',
    };
  }
  return undefined;
};

export const isHolidayDate = (date: Date): boolean => {
  return (date.getMonth() === 11 && date.getDate() === 31) || HOLIDAY_MAP_CACHE.has(formatIsoDateKey(date));
};
