export function toIsoDate(date: Date = new Date()): string {
  return date.toISOString();
}

export type DisplayDateFormat = 'long' | 'short';
let displayDateFormat: DisplayDateFormat = 'long';

export function setDisplayDateFormat(value: string | null): void {
  displayDateFormat = value === 'short' ? 'short' : 'long';
}

export function formatDisplayDate(isoDate: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: displayDateFormat,
    day: 'numeric',
  }).format(new Date(isoDate));
}

export function formatMonth(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function isValidDateString(value: string): boolean {
  if (!value.trim()) {
    return false;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp);
}

export function startOfDayIso(date: Date): string {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value.toISOString();
}

export function endOfDayIso(date: Date): string {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value.toISOString();
}

export function calendarDaysInclusive(startDate: Date, endDate: Date): number {
  const start = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const end = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  return Math.max(0, Math.round((end - start) / 86_400_000) + 1);
}

export function millisecondsUntilNextLocalDay(referenceDate: Date = new Date()): number {
  const nextDay = new Date(referenceDate);
  nextDay.setHours(24, 0, 0, 0);
  return Math.max(1, nextDay.getTime() - referenceDate.getTime());
}

export function dateKey(isoDate: string): string {
  const date = new Date(isoDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export type DatePeriod = {
  fromDate: string;
  toDate: string;
  label: string;
  budgetMonth?: string;
};

export function monthPeriod(offset = 0, referenceDate: Date = new Date()): DatePeriod {
  const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + offset, 1);
  const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + offset + 1, 0, 23, 59, 59, 999);
  return {
    fromDate: start.toISOString(),
    toDate: end.toISOString(),
    label: new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(start),
    budgetMonth: formatMonth(start),
  };
}

export function periodForMonth(month: string): DatePeriod {
  const [yearText, monthText] = month.split('-');
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
  return {
    fromDate: start.toISOString(),
    toDate: end.toISOString(),
    label: new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(start),
    budgetMonth: formatMonth(start),
  };
}

export function weekPeriod(offset = 0, referenceDate: Date = new Date()): DatePeriod {
  const start = new Date(referenceDate);
  const day = start.getDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  start.setDate(start.getDate() - daysFromMonday + (offset * 7));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return {
    fromDate: start.toISOString(),
    toDate: end.toISOString(),
    label: `${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(start)} – ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(end)}`,
  };
}

export function yearPeriod(offset = 0, referenceDate: Date = new Date()): DatePeriod {
  const year = referenceDate.getFullYear() + offset;
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59, 999);
  return {
    fromDate: start.toISOString(),
    toDate: end.toISOString(),
    label: String(year),
  };
}

export function daysBetween(fromDate: string, toDate: string): number {
  const difference = new Date(toDate).getTime() - new Date(fromDate).getTime();
  return Math.max(1, Math.ceil(difference / 86_400_000));
}

export function effectiveDaysForPeriod(fromDate: string, toDate: string, referenceDate: Date = new Date()): number {
  const from = new Date(fromDate).getTime();
  const to = Math.min(new Date(toDate).getTime(), referenceDate.getTime());
  if (to < from) {
    return 1;
  }
  return daysBetween(fromDate, new Date(to).toISOString());
}
