import type { AnalyticsRepository } from '../src/database/repositories/analytics.repository';
import type { BudgetRepository } from '../src/database/repositories/budget.repository';
import { DashboardService } from '../src/features/dashboard/services/dashboard.service';

describe('DashboardService', () => {
  it('calculates all-time balance and current-month comparison', async () => {
    const analytics = {
      getTotals: jest.fn()
        .mockResolvedValueOnce({ income: 100000, expenses: 40000 })
        .mockResolvedValueOnce({ income: 30000, expenses: 12000 })
        .mockResolvedValueOnce({ income: 20000, expenses: 8000 }),
      getCategorySpending: jest.fn().mockResolvedValue([{ categoryId: 'food', categoryName: 'Food', categoryIcon: '🍜', amount: 12000 }]),
      getRecentTransactions: jest.fn().mockResolvedValue([]),
    } as unknown as AnalyticsRepository;
    const budgets = { list: jest.fn().mockResolvedValue([{ id: 'b1', month: '2026-11', categoryId: null, amount: 20000 }]) } as unknown as BudgetRepository;
    const dashboard = await new DashboardService(analytics, budgets).getDashboard(new Date(2026, 10, 15));

    expect(dashboard.balance).toBe(60000);
    expect(dashboard.monthIncome).toBe(30000);
    expect(dashboard.monthExpenses).toBe(12000);
    expect(dashboard.remainingBudget).toBe(8000);
    expect(dashboard.previousMonthChangePercentage).toBe(50);
    expect(dashboard.highestSpendingCategory?.categoryName).toBe('Food');
  });

  it('returns an honest empty dashboard when there are no transactions or budget', async () => {
    const analytics = {
      getTotals: jest.fn().mockResolvedValue({ income: 0, expenses: 0 }),
      getCategorySpending: jest.fn().mockResolvedValue([]),
      getRecentTransactions: jest.fn().mockResolvedValue([]),
    } as unknown as AnalyticsRepository;
    const budgets = { list: jest.fn().mockResolvedValue([]) } as unknown as BudgetRepository;

    const dashboard = await new DashboardService(analytics, budgets).getDashboard(new Date(2026, 10, 15));

    expect(dashboard).toMatchObject({
      balance: 0,
      monthIncome: 0,
      monthExpenses: 0,
      totalBudget: 0,
      remainingBudget: 0,
      budgetUsagePercentage: 0,
      dailyAverageSpending: 0,
      highestSpendingCategory: null,
      recentTransactions: [],
    });
  });

  it('keeps an exceeded budget visible without blocking dashboard data', async () => {
    const analytics = {
      getTotals: jest.fn()
        .mockResolvedValueOnce({ income: 100000, expenses: 90000 })
        .mockResolvedValueOnce({ income: 50000, expenses: 40000 })
        .mockResolvedValueOnce({ income: 40000, expenses: 30000 }),
      getCategorySpending: jest.fn().mockResolvedValue([]),
      getRecentTransactions: jest.fn().mockResolvedValue([]),
    } as unknown as AnalyticsRepository;
    const budgets = { list: jest.fn().mockResolvedValue([{ id: 'b1', month: '2026-11', categoryId: null, amount: 20000 }]) } as unknown as BudgetRepository;

    const dashboard = await new DashboardService(analytics, budgets).getDashboard(new Date(2026, 10, 15));

    expect(dashboard.balance).toBe(10000);
    expect(dashboard.remainingBudget).toBe(-20000);
    expect(dashboard.budgetUsagePercentage).toBe(200);
  });

  it('shows a negative all-time balance when recorded expenses exceed income', async () => {
    const analytics = {
      getTotals: jest.fn()
        .mockResolvedValueOnce({ income: 20000, expenses: 30000 })
        .mockResolvedValueOnce({ income: 10000, expenses: 30000 })
        .mockResolvedValueOnce({ income: 10000, expenses: 0 }),
      getCategorySpending: jest.fn().mockResolvedValue([]),
      getRecentTransactions: jest.fn().mockResolvedValue([]),
    } as unknown as AnalyticsRepository;
    const budgets = { list: jest.fn().mockResolvedValue([]) } as unknown as BudgetRepository;

    const dashboard = await new DashboardService(analytics, budgets).getDashboard(new Date(2026, 10, 15));

    expect(dashboard.balance).toBe(-10000);
    expect(analytics.getTotals).toHaveBeenCalledWith();
  });
});
