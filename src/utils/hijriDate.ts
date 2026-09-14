/**
 * Konversi tanggal Masehi ke penanggalan Hijriah (Ummul Qura / Algoritma Astrologi)
 * Dilengkapi dengan offset (+/- hari) untuk penyesuaian rukyatul hilal di Indonesia.
 */

const HIJRI_MONTHS = [
  'Muharram',
  'Safar',
  'Rabi\'ul Awwal',
  'Rabi\'ul Akhir',
  'Jumadil Ula',
  'Jumadil Akhir',
  'Rajab',
  'Sya\'ban',
  'Ramadhan',
  'Syawwal',
  'Dzulqa\'dah',
  'Dzulhijjah',
];

const INDO_DAYS = [
  'Ahad',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jum\'at',
  'Sabtu',
];

export function getIndonesianDayName(date: Date): string {
  return INDO_DAYS[date.getDay()];
}

export function formatMasehiDate(date: Date): string {
  const dayName = getIndonesianDayName(date);
  const day = date.getDate();
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${dayName}, ${day} ${month} ${year}`;
}

/**
 * Kuwaiti Algorithm / Tabular Islamic Calendar with Hijri Offset
 */
export function getHijriDate(date: Date, dayOffset = 0): { day: number; monthName: string; year: number; formatted: string } {
  const adjustedDate = new Date(date);
  adjustedDate.setDate(adjustedDate.getDate() + dayOffset);

  let day = adjustedDate.getDate();
  let month = adjustedDate.getMonth();
  let year = adjustedDate.getFullYear();

  let m = month + 1;
  let y = year;
  if (m < 3) {
    y -= 1;
    m += 12;
  }

  let a = Math.floor(y / 100);
  let b = 2 - a + Math.floor(a / 4);
  if (y < 1583) b = 0;
  if (y === 1582) {
    if (m > 10) b = -10;
    if (m === 10) {
      b = 0;
      if (day > 4) b = -10;
    }
  }

  let jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524;

  b = 0;
  if (jd > 2299160) {
    a = Math.floor((jd - 1867216.25) / 36524.25);
    b = jd + 1 + a - Math.floor(a / 4);
  } else {
    b = jd;
  }

  let bb = b + 1524;
  let cc = Math.floor((bb - 122.1) / 365.25);
  let dd = Math.floor(365.25 * cc);
  let ee = Math.floor((bb - dd) / 30.6001);
  day = bb - dd - Math.floor(30.6001 * ee);
  month = ee - 1;
  if (ee > 13) {
    cc += 1;
    month = ee - 13;
  }
  year = cc - 4716;

  let iyear = 10631 / 30;
  let epochastro = 1948084;

  let shift1 = 8.01 / 60;

  let z = jd - epochastro;
  let cyc = Math.floor(z / 10631);
  z = z - 10631 * cyc;
  let j = Math.floor((z - shift1) / iyear);
  let iy = 30 * cyc + j;
  z = z - Math.floor(j * iyear + shift1);
  let im = Math.floor((z + 28.5001) / 29.5);
  if (im === 13) im = 12;
  let id = z - Math.floor(29.5001 * im - 29);

  let hijriYear = iy;
  let hijriMonth = im - 1;
  let hijriDay = id;

  if (hijriMonth < 0) {
    hijriMonth = 11;
    hijriYear -= 1;
  }

  const monthName = HIJRI_MONTHS[hijriMonth] || 'Ramadhan';

  return {
    day: hijriDay,
    monthName,
    year: hijriYear,
    formatted: `${hijriDay} ${monthName} ${hijriYear} H`,
  };
}
