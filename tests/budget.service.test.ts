import type { AnalyticsRepository } from '../src/database/repositories/analytics.repository';
import type { BudgetRepository } from '../src/database/repositories/budget.repository';
import type { CategoryRepository } from '../src/database/repositories/category.repository';
import { BudgetService, getBudgetStatus } from '../src/features/budget/services/budget.service';

describe('BudgetService', () => {
  it('uses expense transactions only and marks an exceeded overall budget', async () => {
    const budgets = { list: jest.fn().mockResolvedValue([{ id: 'b1', month: '2026-11', categoryId: null, amount: 10000 }]) } as unknown as BudgetRepository;
    const categories = { list: jest.fn().mockResolvedValue([]) } as unknown as CategoryRepository;
    const analytics = {
      getTotals: jest.fn().mockResolvedValue({ income: 50000, expenses: 12000 }),
      getCategorySpending: jest.fn().mockResolvedValue([]),
    } as unknown as AnalyticsRepository;
    const summary = await new BudgetService(budgets, categories, analytics).getSummary('2026-11');

    expect(summary.totalSpent).toBe(12000);
    expect(summary.budgets[0].usagePercentage).toBe(120);
    expect(summary.budgets[0].status).toBe('exceeded');
    expect(getBudgetStatus(69)).toBe('normal');
    expect(getBudgetStatus(70)).toBe('approaching');
    expect(getBudgetStatus(90)).toBe('almost-exhausted');
  });

  it('isolates category budgets from other categories and income', async () => {
    const budgets = { list: jest.fn().mockResolvedValue([{ id: 'b-food', month: '2026-11', categoryId: 'food', amount: 5000 }]) } as unknown as BudgetRepository;
    const categories = { list: jest.fn().mockResolvedValue([{ id: 'food', name: 'Food', icon: '🍜', type: 'expense', isDefault: true }]) } as unknown as CategoryRepository;
    const analytics = {
      getTotals: jest.fn().mockResolvedValue({ income: 50000, expenses: 3000 }),
      getCategorySpending: jest.fn().mockResolvedValue([{ categoryId: 'food', categoryName: 'Food', categoryIcon: '🍜', amount: 3000 }]),
    } as unknown as AnalyticsRepository;
    const summary = await new BudgetService(budgets, categories, analytics).getSummary('2026-11');

    expect(summary.totalBudget).toBe(5000);
    expect(summary.budgets[0].spent).toBe(3000);
    expect(summary.budgets[0].remaining).toBe(2000);
    expect(summary.budgets[0].usagePercentage).toBe(60);
  });
});
