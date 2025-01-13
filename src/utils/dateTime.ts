export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-KE', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: 'Africa/Nairobi',
  }).format(date);
}

export function isPeakHour(date: Date = new Date()): boolean {
  const hour = date.getHours();
  return (hour >= 6 && hour <= 8) || (hour >= 17 && hour <= 19);
}