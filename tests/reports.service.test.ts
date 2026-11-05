import type { AnalyticsRepository } from '../src/database/repositories/analytics.repository';
import type { BudgetRepository } from '../src/database/repositories/budget.repository';
import { reportPeriodForMonth, ReportsService } from '../src/features/reports/services/reports.service';

describe('ReportsService', () => {
  it('calculates net savings, daily average, and category percentages from aggregates', async () => {
    const analytics = {
      getTotals: jest.fn().mockResolvedValue({ income: 30000, expenses: 12000 }),
      getCategorySpending: jest.fn().mockResolvedValue([
        { categoryId: 'food', categoryName: 'Food & Drinks', categoryIcon: '🍜', amount: 9000 },
        { categoryId: 'bus', categoryName: 'Transportation', categoryIcon: '🚌', amount: 3000 },
      ]),
      getIncomeSourceBreakdown: jest.fn().mockResolvedValue([{ categoryId: 'salary', categoryName: 'Salary', categoryIcon: '💼', amount: 30000 }]),
      getDailySpending: jest.fn().mockResolvedValue([]),
      getMonthlySpending: jest.fn().mockResolvedValue([]),
      getHighestExpense: jest.fn().mockResolvedValue(null),
    } as unknown as AnalyticsRepository;
    const budgets = { list: jest.fn().mockResolvedValue([]) } as unknown as BudgetRepository;
    const report = await new ReportsService(analytics, budgets).getReport({
      fromDate: '2026-11-01T00:00:00.000Z',
      toDate: '2026-11-03T23:59:59.999Z',
      label: 'Test period',
    });

    expect(report.totalIncome).toBe(30000);
    expect(report.incomeSources).toEqual([{ categoryId: 'salary', categoryName: 'Salary', categoryIcon: '💼', amount: 30000, percentage: 100 }]);
    expect(report.totalExpenses).toBe(12000);
    expect(report.netSavings).toBe(18000);
    expect(report.averageDailySpending).toBe(4000);
    expect(report.highestSpendingCategory?.categoryName).toBe('Food & Drinks');
    expect(report.highestSpendingCategory?.percentage).toBe(75);
    expect(report.lowestSpendingCategory?.categoryName).toBe('Transportation');
  });

  it('keeps empty periods honest and fills missing month buckets with zeroes', async () => {
    const analytics = {
      getTotals: jest.fn().mockResolvedValue({ income: 0, expenses: 0 }),
      getCategorySpending: jest.fn().mockResolvedValue([]),
      getIncomeSourceBreakdown: jest.fn().mockResolvedValue([]),
      getDailySpending: jest.fn().mockResolvedValue([]),
      getMonthlySpending: jest.fn().mockResolvedValue([{ month: '2026-11', income: 0, expenses: 0 }]),
      getHighestExpense: jest.fn().mockResolvedValue(null),
    } as unknown as AnalyticsRepository;
    const budgets = { list: jest.fn().mockResolvedValue([]) } as unknown as BudgetRepository;
    const report = await new ReportsService(analytics, budgets).getReport({
      fromDate: new Date(2026, 9, 1).toISOString(),
      toDate: new Date(2026, 10, 30, 23, 59, 59, 999).toISOString(),
      label: 'Two months',
    });

    expect(report.totalIncome).toBe(0);
    expect(report.totalExpenses).toBe(0);
    expect(report.highestSpendingCategory).toBeNull();
    expect(report.insights).toEqual(['Add income or expenses to start seeing insights.']);
    expect(report.monthlySpending).toEqual([
      { month: '2026-10', income: 0, expenses: 0 },
      { month: '2026-11', income: 0, expenses: 0 },
    ]);
  });

  it('calculates savings rate and monthly budget performance from service data', async () => {
    const analytics = {
      getTotals: jest.fn().mockResolvedValue({ income: 100000, expenses: 40000 }),
      getCategorySpending: jest.fn().mockResolvedValue([{ categoryId: 'food', categoryName: 'Food', categoryIcon: '🍜', amount: 40000 }]),
      getIncomeSourceBreakdown: jest.fn().mockResolvedValue([]),
      getDailySpending: jest.fn().mockResolvedValue([]),
      getMonthlySpending: jest.fn().mockResolvedValue([{ month: '2026-11', income: 100000, expenses: 40000 }]),
      getHighestExpense: jest.fn().mockResolvedValue({ id: 't1', type: 'expense', amount: 15000, categoryId: 'food', categoryName: 'Food', categoryIcon: '🍜', note: 'Lunch', date: '2026-11-02T00:00:00.000Z', createdAt: '2026-11-02T00:00:00.000Z', updatedAt: '2026-11-02T00:00:00.000Z' }),
    } as unknown as AnalyticsRepository;
    const budgets = { list: jest.fn().mockResolvedValue([{ id: 'b1', month: '2026-11', categoryId: null, amount: 50000 }]) } as unknown as BudgetRepository;

    const report = await new ReportsService(analytics, budgets).getReport(reportPeriodForMonth('2026-11'));

    expect(report.netSavings).toBe(60000);
    expect(report.savingsRate).toBe(60);
    expect(report.highestExpense?.amount).toBe(15000);
    expect(report.budget).toMatchObject({ totalBudget: 50000, actualSpending: 40000, remaining: 10000, usagePercentage: 80, status: 'approaching' });
  });
});
