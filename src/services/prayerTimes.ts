import { Coordinates, CalculationMethod, PrayerTimes, Madhab } from 'adhan';
import type { MosqueConfig, CalculatedPrayers, PrayerName } from '../types';

export const PRAYER_LABELS: Record<PrayerName, string> = {
  fajr: 'Subuh',
  sunrise: 'Terbit',
  dhuhr: 'Dzuhur',
  asr: 'Ashar',
  maghrib: 'Maghrib',
  isha: 'Isya',
};

export function getCalculationParameters(method: MosqueConfig['calcMethod']) {
  let params;
  switch (method) {
    case 'MWL':
      params = CalculationMethod.MuslimWorldLeague();
      break;
    case 'EGYPT':
      params = CalculationMethod.Egyptian();
      break;
    case 'MAKKAH':
      params = CalculationMethod.UmmAlQura();
      break;
    case 'KEMENAG':
    default:
      // Standar Kemenag RI: Subuh 20°, Isya 18°
      params = CalculationMethod.Singapore();
      params.fajrAngle = 20.0;
      params.ishaAngle = 18.0;
      break;
  }
  params.madhab = Madhab.Shafi;
  return params;
}

export function computePrayers(config: MosqueConfig, date: Date = new Date()): CalculatedPrayers {
  const coordinates = new Coordinates(config.latitude, config.longitude);
  const params = getCalculationParameters(config.calcMethod);
  const pt = new PrayerTimes(coordinates, date, params);

  // Terapkan koreksi waktu ihtiati (menit)
  const adjust = (d: Date, minutes: number): Date => {
    return new Date(d.getTime() + minutes * 60 * 1000);
  };

  const fajr = adjust(pt.fajr, config.prayerAdjustments.fajr);
  const sunrise = adjust(pt.sunrise, config.prayerAdjustments.sunrise);
  const dhuhr = adjust(pt.dhuhr, config.prayerAdjustments.dhuhr);
  const asr = adjust(pt.asr, config.prayerAdjustments.asr);
  const maghrib = adjust(pt.maghrib, config.prayerAdjustments.maghrib);
  const isha = adjust(pt.isha, config.prayerAdjustments.isha);

  const prayerSchedule: { name: PrayerName; time: Date; label: string }[] = [
    { name: 'fajr', time: fajr, label: PRAYER_LABELS.fajr },
    { name: 'sunrise', time: sunrise, label: PRAYER_LABELS.sunrise },
    { name: 'dhuhr', time: dhuhr, label: PRAYER_LABELS.dhuhr },
    { name: 'asr', time: asr, label: PRAYER_LABELS.asr },
    { name: 'maghrib', time: maghrib, label: PRAYER_LABELS.maghrib },
    { name: 'isha', time: isha, label: PRAYER_LABELS.isha },
  ];

  const nowMs = date.getTime();

  // Deteksi jika ada waktu sholat fardhu (bukan terbit) yang baru saja masuk dalam rentang 0-120 detik
  const fardhuPrayers: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const currentAdzan = prayerSchedule.find((p) => {
    if (!fardhuPrayers.includes(p.name)) return false;
    const diff = nowMs - p.time.getTime();
    return diff >= 0 && diff < 120_000; // 2 menit masa masuk adzan
  }) || null;

  let next = prayerSchedule.find((p) => p.time.getTime() > nowMs);

  // Jika semua jadwal hari ini sudah lewat (setelah Isya), sholat berikutnya adalah Subuh besok
  if (!next) {
    const tomorrow = new Date(date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowPt = new PrayerTimes(coordinates, tomorrow, params);
    const tomorrowFajr = adjust(tomorrowPt.fajr, config.prayerAdjustments.fajr);
    next = {
      name: 'fajr',
      time: tomorrowFajr,
      label: PRAYER_LABELS.fajr,
    };
  }

  const timeRemainingSeconds = Math.max(0, Math.floor((next.time.getTime() - nowMs) / 1000));

  return {
    fajr,
    sunrise,
    dhuhr,
    asr,
    maghrib,
    isha,
    nextPrayer: next,
    timeRemainingSeconds,
    currentAdzanPrayer: currentAdzan,
    prayerSchedule,
  };
}
