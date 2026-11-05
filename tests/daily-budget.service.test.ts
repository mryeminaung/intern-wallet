import type { AnalyticsRepository } from '../src/database/repositories/analytics.repository';
import type { SettingsRepository } from '../src/database/repositories/settings.repository';
import { DailyBudgetService } from '../src/features/budget/services/daily-budget.service';
import { settingKeys } from '../src/lib/constants';
import { endOfDayIso, startOfDayIso } from '../src/lib/date';

function settings(values: Record<string, string>): SettingsRepository {
  return { get: jest.fn(async (key: string) => values[key] ?? null), set: jest.fn(), setMany: jest.fn(), list: jest.fn() };
}

describe('DailyBudgetService', () => {
  it('calculates today remaining and internship safe spending from local dates', async () => {
    const analytics = {
      getTotals: jest.fn()
        .mockResolvedValueOnce({ income: 0, expenses: 8500 })
        .mockResolvedValueOnce({ income: 100000, expenses: 40000 })
        .mockResolvedValueOnce({ income: 100000, expenses: 40000 }),
    } as unknown as AnalyticsRepository;
    const start = new Date(2026, 10, 1).toISOString();
    const end = new Date(2026, 10, 30).toISOString();
    const service = new DailyBudgetService(analytics, settings({ [settingKeys.dailyBudgetLimit]: '15000', [settingKeys.internshipStartDate]: start, [settingKeys.internshipEndDate]: end }));

    const summary = await service.getSummary(new Date(2026, 10, 15));

    expect(summary.spentToday).toBe(8500);
    expect(summary.remainingToday).toBe(6500);
    expect(summary.usagePercentage).toBeCloseTo(56.666, 2);
    expect(summary.completedDays).toBe(15);
    expect(summary.remainingDays).toBe(15);
    expect(summary.availableBalance).toBe(60000);
    expect(summary.suggestedSafeDailySpending).toBe(3750);
  });

  it('includes savings before the internship in available balance but not internship income', async () => {
    const referenceDate = new Date(2026, 10, 15);
    const analytics = {
      getTotals: jest.fn(async (fromDate?: string, toDate?: string) => {
        if (!fromDate && !toDate) return { income: 150000, expenses: 120000 };
        if (fromDate === startOfDayIso(referenceDate)) return { income: 0, expenses: 5000 };
        return { income: 100000, expenses: 120000 };
      }),
    } as unknown as AnalyticsRepository;
    const start = new Date(2026, 10, 1).toISOString();
    const end = new Date(2026, 10, 30).toISOString();
    const service = new DailyBudgetService(analytics, settings({ [settingKeys.internshipStartDate]: start, [settingKeys.internshipEndDate]: end }));

    const summary = await service.getSummary(referenceDate);

    expect(summary.availableBalance).toBe(30000);
    expect(summary.internshipIncome).toBe(100000);
    expect(summary.internshipExpenses).toBe(120000);
    expect(summary.suggestedSafeDailySpending).toBe(1875);
    expect(analytics.getTotals).toHaveBeenCalledWith();
    expect(analytics.getTotals).toHaveBeenCalledWith(
      new Date(2026, 10, 1).toISOString(),
      endOfDayIso(referenceDate),
    );
  });

  it('warns when the daily limit is exceeded and keeps negative balances safe', async () => {
    const analytics = {
      getTotals: jest.fn()
        .mockResolvedValueOnce({ income: 0, expenses: 12000 })
        .mockResolvedValueOnce({ income: 10000, expenses: 12000 }),
    } as unknown as AnalyticsRepository;
    const service = new DailyBudgetService(analytics, settings({ [settingKeys.dailyBudgetLimit]: '10000' }));

    const summary = await service.getSummary(new Date(2026, 10, 15));

    expect(summary.isExceeded).toBe(true);
    expect(summary.remainingToday).toBe(-2000);
    expect(summary.availableBalance).toBe(-2000);
    expect(summary.internshipIncome).toBeNull();
    expect(summary.internshipExpenses).toBeNull();
    expect(summary.suggestedSafeDailySpending).toBeNull();
  });

  it('includes today when it is the last internship day', async () => {
    const analytics = {
      getTotals: jest.fn()
        .mockResolvedValueOnce({ income: 0, expenses: 5000 })
        .mockResolvedValueOnce({ income: 50000, expenses: 20000 })
        .mockResolvedValueOnce({ income: 50000, expenses: 20000 }),
    } as unknown as AnalyticsRepository;
    const date = new Date(2026, 10, 15);
    const isoDate = date.toISOString();
    const service = new DailyBudgetService(analytics, settings({ [settingKeys.internshipStartDate]: isoDate, [settingKeys.internshipEndDate]: isoDate }));

    const summary = await service.getSummary(date);

    expect(summary.completedDays).toBe(1);
    expect(summary.remainingDays).toBe(0);
    expect(summary.suggestedSafeDailySpending).toBe(30000);
  });

  it('keeps zero and negative all-time balances independent of internship totals', async () => {
    const start = new Date(2026, 10, 1).toISOString();
    const end = new Date(2026, 10, 30).toISOString();
    const configured = settings({ [settingKeys.internshipStartDate]: start, [settingKeys.internshipEndDate]: end });
    for (const [recorded, expected] of [
      [{ income: 0, expenses: 0 }, 0],
      [{ income: 20000, expenses: 30000 }, -10000],
    ] as const) {
      const analytics = {
        getTotals: jest.fn()
          .mockResolvedValueOnce({ income: 0, expenses: 0 })
          .mockResolvedValueOnce(recorded)
          .mockResolvedValueOnce({ income: 10000, expenses: 20000 }),
      } as unknown as AnalyticsRepository;
      const summary = await new DailyBudgetService(analytics, configured).getSummary(new Date(2026, 10, 15));
      expect(summary.availableBalance).toBe(expected);
      expect(summary.internshipIncome).toBe(10000);
      expect(summary.internshipExpenses).toBe(20000);
      if (expected < 0) expect(summary.suggestedSafeDailySpending).toBe(0);
    }
  });

  it.each([
    ['before start', new Date(2026, 9, 31, 12), 0, 3, 300],
    ['first day', new Date(2026, 10, 1, 12), 1, 2, 300],
    ['middle day', new Date(2026, 10, 2, 12), 2, 1, 450],
    ['last day', new Date(2026, 10, 3, 12), 3, 0, 900],
    ['after end', new Date(2026, 10, 4, 12), 3, 0, 0],
  ])('handles %s internship boundary', async (_label, referenceDate, completed, remaining, safeDaily) => {
    const analytics = {
      getTotals: jest.fn(async (fromDate?: string) => {
        if (!fromDate) return { income: 900, expenses: 0 };
        return { income: 0, expenses: 0 };
      }),
    } as unknown as AnalyticsRepository;
    const service = new DailyBudgetService(analytics, settings({
      [settingKeys.internshipStartDate]: new Date(2026, 10, 1).toISOString(),
      [settingKeys.internshipEndDate]: new Date(2026, 10, 3).toISOString(),
    }));
    const summary = await service.getSummary(referenceDate as Date);

    expect(summary.completedDays).toBe(completed);
    expect(summary.remainingDays).toBe(remaining);
    expect(summary.suggestedSafeDailySpending).toBe(safeDaily);
    if (completed === 0) {
      expect(summary.internshipIncome).toBe(0);
      expect(analytics.getTotals).toHaveBeenCalledTimes(2);
    }
  });

  it('handles large MMK amounts and keeps an overrun visible', async () => {
    const analytics = {
      getTotals: jest.fn()
        .mockResolvedValueOnce({ income: 0, expenses: 1_200_000_000_000 })
        .mockResolvedValueOnce({ income: 2_000_000_000_000, expenses: 1_200_000_000_000 })
        .mockResolvedValueOnce({ income: 2_000_000_000_000, expenses: 1_200_000_000_000 }),
    } as unknown as AnalyticsRepository;
    const service = new DailyBudgetService(analytics, settings({
      [settingKeys.dailyBudgetLimit]: '1000000000000',
      [settingKeys.internshipStartDate]: new Date(2026, 10, 1).toISOString(),
      [settingKeys.internshipEndDate]: new Date(2026, 10, 2).toISOString(),
    }));
    const summary = await service.getSummary(new Date(2026, 10, 1, 12));

    expect(summary.remainingToday).toBe(-200_000_000_000);
    expect(summary.isExceeded).toBe(true);
    expect(summary.availableBalance).toBe(800_000_000_000);
    expect(summary.suggestedSafeDailySpending).toBe(400_000_000_000);
  });

  it('resets today spending at the local midnight boundary', async () => {
    const beforeMidnight = new Date(2026, 10, 15, 23, 59, 59, 900);
    const afterMidnight = new Date(2026, 10, 16, 0, 0, 0);
    const analytics = {
      getTotals: jest.fn(async (fromDate?: string) => {
        if (!fromDate) return { income: 20000, expenses: 9000 };
        return { income: 0, expenses: fromDate === startOfDayIso(beforeMidnight) ? 9000 : 0 };
      }),
    } as unknown as AnalyticsRepository;
    const service = new DailyBudgetService(analytics, settings({ [settingKeys.dailyBudgetLimit]: '10000' }));

    const before = await service.getSummary(beforeMidnight);
    const after = await service.getSummary(afterMidnight);

    expect(before.remainingToday).toBe(1000);
    expect(after.remainingToday).toBe(10000);
    expect(analytics.getTotals).toHaveBeenCalledWith(startOfDayIso(beforeMidnight), endOfDayIso(beforeMidnight));
    expect(analytics.getTotals).toHaveBeenCalledWith(startOfDayIso(afterMidnight), endOfDayIso(afterMidnight));
  });

  it('rejects incomplete, invalid, and reversed internship dates', async () => {
    const analytics = { getTotals: jest.fn() } as unknown as AnalyticsRepository;
    const cases: Record<string, string>[] = [
      { [settingKeys.internshipStartDate]: new Date(2026, 10, 1).toISOString() },
      { [settingKeys.internshipStartDate]: 'not a date', [settingKeys.internshipEndDate]: new Date(2026, 10, 3).toISOString() },
      { [settingKeys.internshipStartDate]: new Date(2026, 10, 3).toISOString(), [settingKeys.internshipEndDate]: new Date(2026, 10, 1).toISOString() },
    ];
    for (const values of cases) {
      await expect(new DailyBudgetService(analytics, settings(values)).getSummary()).rejects.toThrow();
    }
    expect(analytics.getTotals).not.toHaveBeenCalled();
  });
});
