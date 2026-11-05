import { calendarDaysInclusive, dateKey, formatMonth, millisecondsUntilNextLocalDay } from '../src/lib/date';

describe('calendar calculations', () => {
  it('uses the device local calendar for month and day grouping', () => {
    const localDate = new Date(2026, 10, 4, 12, 0, 0);
    expect(formatMonth(localDate)).toBe('2026-11');
    expect(dateKey(localDate.toISOString())).toBe('2026-11-04');
  });

  it('counts calendar dates inclusively across month boundaries', () => {
    expect(calendarDaysInclusive(new Date(2026, 9, 31), new Date(2026, 10, 1))).toBe(2);
    expect(calendarDaysInclusive(new Date(2026, 10, 2), new Date(2026, 10, 1))).toBe(0);
  });

  it('schedules the next refresh at local midnight', () => {
    expect(millisecondsUntilNextLocalDay(new Date(2026, 10, 15, 23, 59, 59, 500))).toBe(500);
    expect(millisecondsUntilNextLocalDay(new Date(2026, 10, 16, 0, 0, 0))).toBeGreaterThan(0);
  });
});
