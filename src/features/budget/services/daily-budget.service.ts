import { calendarDaysInclusive, dateKey, endOfDayIso, monthPeriod, startOfDayIso } from '../../../lib/date';
import { settingKeys } from '../../../lib/constants';
import type { AnalyticsRepository } from '../../../database/repositories/analytics.repository';
import type { SettingsRepository } from '../../../database/repositories/settings.repository';

export type DailyBudgetSettings = {
  dailyLimit: number | null;
  internshipStartDate: string | null;
  internshipEndDate: string | null;
};

export type DailyBudgetSummary = DailyBudgetSettings & {
  spentToday: number;
  remainingToday: number | null;
  usagePercentage: number | null;
  isExceeded: boolean;
  internshipIncome: number | null;
  internshipExpenses: number | null;
  internshipBalance: number | null;
  internshipDurationDays: number | null;
  availableBalance: number;
  completedDays: number | null;
  remainingDays: number | null;
  averageDailySpending: number | null;
  suggestedSafeDailySpending: number | null;
};

export type DailyHistoryDay = {
  date: string;
  spent: number;
  limit: number | null;
  remaining: number | null;
  usagePercentage: number | null;
  isExceeded: boolean;
  changeFromPreviousDay: number | null;
};

export type DailyBudgetHistory = {
  periodLabel: string;
  totalSpent: number;
  overBudgetDays: number;
  days: readonly DailyHistoryDay[];
};

export class DailyBudgetService {
  public constructor(
    private readonly analytics: AnalyticsRepository,
    private readonly settings: SettingsRepository,
  ) {}

  public async getSummary(referenceDate: Date = new Date()): Promise<DailyBudgetSummary> {
    const [dailyLimitValue, startDate, endDate] = await Promise.all([
      this.settings.get(settingKeys.dailyBudgetLimit),
      this.settings.get(settingKeys.internshipStartDate),
      this.settings.get(settingKeys.internshipEndDate),
    ]);
    const dailyLimit = parsePositiveInteger(dailyLimitValue);
    if (Boolean(startDate) !== Boolean(endDate)) {
      throw new Error('Both internship dates are required.');
    }
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if ((start && !Number.isFinite(start.getTime())) || (end && !Number.isFinite(end.getTime()))) {
      throw new Error('Internship dates must be valid.');
    }
    if (start && end && calendarDaysInclusive(start, end) === 0) {
      throw new Error('The internship end date must be on or after the start date.');
    }
    const validDates = start !== null && end !== null;
    const [today, recordedTotals, internshipTotals] = await Promise.all([
      this.analytics.getTotals(startOfDayIso(referenceDate), endOfDayIso(referenceDate)),
      this.analytics.getTotals(),
      validDates
        ? calendarDaysInclusive(start, referenceDate) > 0
          ? this.analytics.getTotals(startOfDayIso(start), minDateIso(endOfDayIso(end), endOfDayIso(referenceDate)))
          : Promise.resolve({ income: 0, expenses: 0 })
        : Promise.resolve(null),
    ]);
    const availableBalance = recordedTotals.income - recordedTotals.expenses;
    const spentToday = today.expenses;
    const remainingToday = dailyLimit === null ? null : dailyLimit - spentToday;
    const usagePercentage = dailyLimit === null ? null : (spentToday / dailyLimit) * 100;

    if (!validDates) {
      return {
        dailyLimit,
        internshipStartDate: startDate,
        internshipEndDate: endDate,
        spentToday,
        remainingToday,
        usagePercentage,
        isExceeded: remainingToday !== null && remainingToday < 0,
        internshipIncome: null,
        internshipExpenses: null,
        internshipBalance: null,
        internshipDurationDays: null,
        availableBalance,
        completedDays: null,
        remainingDays: null,
        averageDailySpending: null,
        suggestedSafeDailySpending: null,
      };
    }

    const totalDays = calendarDaysInclusive(start, end);
    const completedDays = Math.min(totalDays, calendarDaysInclusive(start, referenceDate));
    const remainingDays = Math.max(0, totalDays - completedDays);
    const spendingDaysLeft = calendarDaysInclusive(referenceDate.getTime() < start.getTime() ? start : referenceDate, end);
    const averageDailySpending = (internshipTotals?.expenses ?? 0) / Math.max(1, completedDays);

    return {
      dailyLimit,
      internshipStartDate: startDate,
      internshipEndDate: endDate,
      spentToday,
      remainingToday,
      usagePercentage,
      isExceeded: remainingToday !== null && remainingToday < 0,
      internshipIncome: internshipTotals?.income ?? 0,
      internshipExpenses: internshipTotals?.expenses ?? 0,
      internshipBalance: (internshipTotals?.income ?? 0) - (internshipTotals?.expenses ?? 0),
      internshipDurationDays: totalDays,
      availableBalance,
      completedDays,
      remainingDays,
      averageDailySpending,
      suggestedSafeDailySpending: spendingDaysLeft > 0 ? Math.max(0, availableBalance / spendingDaysLeft) : 0,
    };
  }

  public async getHistory(monthDate: Date, referenceDate: Date = new Date()): Promise<DailyBudgetHistory> {
    const period = monthPeriod(0, monthDate);
    const limit = parsePositiveInteger(await this.settings.get(settingKeys.dailyBudgetLimit));
    const lastDate = new Date(Math.min(new Date(period.toDate).getTime(), endOfDayIsoTime(referenceDate)));
    if (lastDate.getTime() < new Date(period.fromDate).getTime()) {
      return { periodLabel: period.label, totalSpent: 0, overBudgetDays: 0, days: [] };
    }
    const rows = await this.analytics.getDailySpending(period.fromDate, lastDate.toISOString());
    const spendingByDate = new Map(rows.map((row) => [row.date, row.amount]));
    const days: DailyHistoryDay[] = [];
    let totalSpent = 0;
    let overBudgetDays = 0;
    let previousSpent: number | null = null;
    const cursor = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    while (cursor.getTime() <= lastDate.getTime()) {
      const spent = spendingByDate.get(dateKey(cursor.toISOString())) ?? 0;
      const remaining = limit === null ? null : limit - spent;
      days.push({
        date: dateKey(cursor.toISOString()),
        spent,
        limit,
        remaining,
        usagePercentage: limit === null ? null : spent / limit * 100,
        isExceeded: remaining !== null && remaining < 0,
        changeFromPreviousDay: previousSpent === null ? null : spent - previousSpent,
      });
      totalSpent += spent;
      if (remaining !== null && remaining < 0) overBudgetDays += 1;
      previousSpent = spent;
      cursor.setDate(cursor.getDate() + 1);
    }
    return { periodLabel: period.label, totalSpent, overBudgetDays, days: days.reverse() };
  }
}

function endOfDayIsoTime(date: Date): number {
  return new Date(endOfDayIso(date)).getTime();
}

function parsePositiveInteger(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function minDateIso(dateValue: string, comparison: string): string {
  return new Date(dateValue).getTime() < new Date(comparison).getTime() ? dateValue : comparison;
}
