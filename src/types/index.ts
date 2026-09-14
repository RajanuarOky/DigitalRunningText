export type PrayerName = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface PrayerAdjustment {
  fajr: number;
  sunrise: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
}

export interface MosqueConfig {
  name: string;
  tagline: string;
  address: string;
  latitude: number;
  longitude: number;
  timezone: string;
  calcMethod: 'KEMENAG' | 'MWL' | 'EGYPT' | 'MAKKAH';
  hijriOffset: number; // Koreksi hari kalender Hijriah (-2 sd +2)
  prayerAdjustments: PrayerAdjustment;
}

export interface TartilPrayerConfig {
  enabled: boolean;
  minutesBefore: number;
  audioTitle: string;
  audioUrl: string;
}

export interface TartilConfig {
  masterEnabled: boolean;
  volume: number; // 0 to 1
  prayers: {
    fajr: TartilPrayerConfig;
    dhuhr: TartilPrayerConfig;
    asr: TartilPrayerConfig;
    maghrib: TartilPrayerConfig;
    isha: TartilPrayerConfig;
  };
}

export interface IqomahConfig {
  durations: {
    fajr: number; // menit
    dhuhr: number;
    asr: number;
    maghrib: number;
    isha: number;
  };
  beepLastSeconds: number;
}

export interface PrayerDisplayModeConfig {
  durationMinutes: number; // Durasi layar sholat redup
  blankScreen: boolean; // Jika true, layar benar-benar gelap
  message: string;
  submessage: string;
}

export interface RunningTextItem {
  id: string;
  text: string;
  active: boolean;
  category?: 'info' | 'hadits' | 'infaq';
}

export interface FinanceReport {
  period: string;
  initialBalance: number;
  income: number;
  expense: number;
  finalBalance: number;
}

export interface FridayInfo {
  khatib: string;
  imam: string;
  muadzin: string;
  date: string;
}

export interface BannerSlide {
  id: string;
  title: string;
  type: 'poster' | 'kas' | 'hadits' | 'jumat';
  imageUrl?: string;
  content?: string;
  source?: string;
  durationSeconds: number;
  active: boolean;
}

export type AppDisplayState = 'NORMAL' | 'TARTIL' | 'ADZAN' | 'IQOMAH' | 'PRAYER';

export interface CalculatedPrayers {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
  nextPrayer: {
    name: PrayerName;
    time: Date;
    label: string;
  };
  timeRemainingSeconds: number;
  currentAdzanPrayer: {
    name: PrayerName;
    time: Date;
    label: string;
  } | null;
  prayerSchedule: {
    name: PrayerName;
    time: Date;
    label: string;
  }[];
}

export interface SystemData {
  mosque: MosqueConfig;
  tartil: TartilConfig;
  iqomah: IqomahConfig;
  prayerMode: PrayerDisplayModeConfig;
  runningTexts: RunningTextItem[];
  finance: FinanceReport;
  friday: FridayInfo;
  banners: BannerSlide[];
  version: number;
}

