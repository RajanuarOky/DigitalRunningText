export function formatCurrencyIDR(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatTwoDigits(val: number): string {
  return val.toString().padStart(2, '0');
}

export function formatTimeHM(date: Date): string {
  const h = formatTwoDigits(date.getHours());
  const m = formatTwoDigits(date.getMinutes());
  return `${h}:${m}`;
}

export function formatTimeHMS(date: Date): string {
  const h = formatTwoDigits(date.getHours());
  const m = formatTwoDigits(date.getMinutes());
  const s = formatTwoDigits(date.getSeconds());
  return `${h}:${m}:${s}`;
}

export function formatSecondsToCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return '00:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${formatTwoDigits(hours)}:${formatTwoDigits(minutes)}:${formatTwoDigits(seconds)}`;
  }
  return `${formatTwoDigits(minutes)}:${formatTwoDigits(seconds)}`;
}
