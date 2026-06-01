export const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00`);
}

export function addDays(dateKey: string, days: number): string {
  if (!DATE_KEY_PATTERN.test(dateKey)) return dateKey;

  const nextDate = parseDateKey(dateKey);
  nextDate.setDate(nextDate.getDate() + days);
  return toDateKey(nextDate);
}

export function uniqueDateKeys(values: string[]): string[] {
  return [...new Set(values.filter((value) => DATE_KEY_PATTERN.test(value)))].sort();
}
