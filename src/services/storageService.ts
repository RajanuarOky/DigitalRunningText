import type { SystemData } from '../types';
export type { SystemData };

const STORAGE_KEY = 'rt_mosque_tv_config_v1';

export const DEFAULT_DATA: SystemData = {
  mosque: {
    name: 'MASJID JAMI\' BAITURRAHMAN',
    tagline: 'Pusat Ibadah, Pembinaan Umat, dan Kebajikan Sosial',
    address: 'Jl. Melati No. 45, Jakarta Selatan | Telp: (021) 7890123',
    latitude: -6.2088,
    longitude: 106.8456,
    timezone: 'Asia/Jakarta',
    calcMethod: 'KEMENAG',
    hijriOffset: 0,
    prayerAdjustments: {
      fajr: 2,
      sunrise: -2,
      dhuhr: 2,
      asr: 2,
      maghrib: 2,
      isha: 2,
    },
  },
  tartil: {
    masterEnabled: true,
    volume: 0.8,
    prayers: {
      fajr: {
        enabled: true,
        minutesBefore: 15,
        audioTitle: 'QS. As-Sajdah (Mishary Rashid)',
        audioUrl: 'https://server8.mp3quran.net/afs/032.mp3',
      },
      dhuhr: {
        enabled: true,
        minutesBefore: 10,
        audioTitle: 'QS. Ar-Rahman (Mishary Rashid)',
        audioUrl: 'https://server8.mp3quran.net/afs/055.mp3',
      },
      asr: {
        enabled: true,
        minutesBefore: 10,
        audioTitle: 'QS. Al-Waqi\'ah (Mishary Rashid)',
        audioUrl: 'https://server8.mp3quran.net/afs/056.mp3',
      },
      maghrib: {
        enabled: true,
        minutesBefore: 10,
        audioTitle: 'QS. Al-Mulk (Mishary Rashid)',
        audioUrl: 'https://server8.mp3quran.net/afs/067.mp3',
      },
      isha: {
        enabled: true,
        minutesBefore: 10,
        audioTitle: 'QS. Yasin (Mishary Rashid)',
        audioUrl: 'https://server8.mp3quran.net/afs/036.mp3',
      },
    },
  },
  iqomah: {
    durations: {
      fajr: 10,
      dhuhr: 8,
      asr: 8,
      maghrib: 5,
      isha: 8,
    },
    beepLastSeconds: 10,
  },
  prayerMode: {
    durationMinutes: 12,
    blankScreen: false,
    message: 'LURUSKAN DAN RAPATKAN SHAF',
    submessage: 'Harap nonaktifkan / nada hening ponsel Anda demi kekhusyukan jamaah',
  },
  runningTexts: [
    {
      id: '1',
      text: 'Selamat Datang di Masjid Jami\' Baiturrahman. Luruskan dan rapatkan shaf saat sholat berjamaah.',
      active: true,
      category: 'info',
    },
    {
      id: '2',
      text: 'Kajian Rutin Ba\'da Maghrib setiap Kamis malam: Membahas Kitab Riyadhus Shalihin bersama Ustadz.',
      active: true,
      category: 'info',
    },
    {
      id: '3',
      text: 'Infaq & Sedekah operasional dapat disalurkan melalui Rekening BSI: 7123-456-789 a.n DKM Baiturrahman.',
      active: true,
      category: 'infaq',
    },
    {
      id: '4',
      text: 'Rasulullah ﷺ bersabda: "Barangsiapa membangun masjid karena Allah, maka Allah akan membangunkan baginya semisal itu di surga." (HR. Bukhari)',
      active: true,
      category: 'hadits',
    },
  ],
  finance: {
    period: 'Pekan Ini',
    initialBalance: 36500000,
    income: 8750000,
    expense: 2450000,
    finalBalance: 42800000,
  },
  friday: {
    date: 'Jum\'at Ini',
    khatib: 'Ust. Ahmad Fauzan, Lc., M.Ag.',
    imam: 'Ust. Muhammad Rizki Al-Hafidz',
    muadzin: 'Ustadz Bilal Ramadhan',
  },
  banners: [
    {
      id: 'b1',
      title: 'Kajian Rutin Sabtu Subuh',
      type: 'poster',
      imageUrl: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&w=1200&q=80',
      content: 'Kajian Tematik Fiqih Ibadah bersama Dewan Syariah. Setiap Sabtu Ba\'da Subuh di Ruang Utama Masjid.',
      durationSeconds: 15,
      active: true,
    },
    {
      id: 'b2',
      title: 'Laporan Kas Masjid',
      type: 'kas',
      durationSeconds: 12,
      active: true,
    },
    {
      id: 'b3',
      title: 'Petugas Shalat Jum\'at',
      type: 'jumat',
      durationSeconds: 12,
      active: true,
    },
    {
      id: 'b4',
      title: 'Kutipan Hadits Hari Ini',
      type: 'hadits',
      content: 'Shalat berjamaah lebih utama daripada shalat sendirian sebanyak dua puluh tujuh derajat.',
      source: 'HR. Bukhari no. 645 dan Muslim no. 650',
      durationSeconds: 12,
      active: true,
    },
  ],
  version: 1,
};

export const storageService = {
  loadData(): SystemData {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const loaded: SystemData = {
          ...DEFAULT_DATA,
          ...parsed,
          mosque: { ...DEFAULT_DATA.mosque, ...(parsed.mosque || {}) },
          tartil: {
            ...DEFAULT_DATA.tartil,
            ...(parsed.tartil || {}),
            prayers: {
              ...DEFAULT_DATA.tartil.prayers,
              ...(parsed.tartil?.prayers || {}),
            },
          },
          iqomah: { ...DEFAULT_DATA.iqomah, ...(parsed.iqomah || {}) },
          prayerMode: { ...DEFAULT_DATA.prayerMode, ...(parsed.prayerMode || {}) },
        };

        // Migrasi URL murottal legacy ke mirror CDN cepat server8.mp3quran.net
        if (loaded.tartil && loaded.tartil.prayers) {
          const prayers = loaded.tartil.prayers;
          (Object.keys(prayers) as Array<keyof typeof prayers>).forEach((key) => {
            const p = prayers[key];
            if (p && p.audioUrl && p.audioUrl.includes('cdn.islamic.network')) {
              const m = p.audioUrl.match(/\/(\d+)\.mp3/);
              if (m) {
                p.audioUrl = `https://server8.mp3quran.net/afs/${m[1].padStart(3, '0')}.mp3`;
              }
            }
          });
        }

        return loaded;
      }
    } catch (e) {
      console.warn('Gagal membaca localStorage, gunakan default:', e);
    }
    return DEFAULT_DATA;
  },

  saveData(data: SystemData) {
    try {
      data.version = (data.version || 1) + 1;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      // Dispatch custom event untuk sinkronisasi realtime pada window yang sama / multi-tab
      window.dispatchEvent(new CustomEvent('rt_mosque_sync', { detail: data }));
    } catch (e) {
      console.error('Gagal menyimpan data ke localStorage:', e);
    }
  },

  resetDefaults(): SystemData {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('rt_mosque_sync', { detail: DEFAULT_DATA }));
    return DEFAULT_DATA;
  },
};
