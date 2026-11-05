import { periodForMonth } from '../../../lib/date';
import type { AnalyticsRepository } from '../../../database/repositories/analytics.repository';
import type { BudgetRepository } from '../../../database/repositories/budget.repository';
import type { CategoryRepository } from '../../../database/repositories/category.repository';
import type { Budget, BudgetProgress, Category, CreateBudgetInput } from '../../../types/common';

export class BudgetServiceError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'BudgetServiceError';
  }
}

export type BudgetSummary = {
  month: string;
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  usagePercentage: number;
  budgets: readonly BudgetProgress[];
};

export function getBudgetStatus(usagePercentage: number): BudgetProgress['status'] {
  if (usagePercentage >= 100) return 'exceeded';
  if (usagePercentage >= 90) return 'almost-exhausted';
  if (usagePercentage >= 70) return 'approaching';
  return 'normal';
}

export class BudgetService {
  public constructor(
    private readonly budgets: BudgetRepository,
    private readonly categories: CategoryRepository,
    private readonly analytics: AnalyticsRepository,
  ) {}

  public async getSummary(month: string): Promise<BudgetSummary> {
    const period = periodForMonth(month);
    const [budgets, categories, totals, spending] = await Promise.all([
      this.budgets.list(month),
      this.categories.list('expense'),
      this.analytics.getTotals(period.fromDate, period.toDate),
      this.analytics.getCategorySpending(period.fromDate, period.toDate),
    ]);
    const categoryMap = new Map(categories.map((category) => [category.id, category]));
    const spendingMap = new Map(spending.map((row) => [row.categoryId, row.amount]));
    const progress = budgets.map((budget) => this.toProgress(budget, categoryMap.get(budget.categoryId ?? '') ?? null, budget.categoryId ? spendingMap.get(budget.categoryId) ?? 0 : totals.expenses));
    const overallBudget = progress.find((budget) => budget.categoryId === null);
    const totalBudget = overallBudget?.amount ?? progress.filter((budget) => budget.categoryId !== null).reduce((sum, budget) => sum + budget.amount, 0);
    const totalSpent = totals.expenses;
    return {
      month,
      totalBudget,
      totalSpent,
      remaining: totalBudget - totalSpent,
      usagePercentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      budgets: progress,
    };
  }

  public async create(input: CreateBudgetInput): Promise<Budget> {
    await this.validateInput(input);
    await this.ensureScopeIsUnique(input);
    try {
      return await this.budgets.create(input);
    } catch {
      throw new BudgetServiceError('A budget already exists for this month and scope.');
    }
  }

  public async update(id: string, input: CreateBudgetInput): Promise<Budget> {
    await this.validateInput(input);
    await this.ensureScopeIsUnique(input, id);
    try {
      const budget = await this.budgets.update(id, input);
      if (!budget) {
        throw new BudgetServiceError('This budget no longer exists.');
      }
      return budget;
    } catch (cause) {
      if (cause instanceof BudgetServiceError) {
        throw cause;
      }
      throw new BudgetServiceError('A budget already exists for this month and scope.');
    }
  }

  public async delete(id: string): Promise<void> {
    if (!(await this.budgets.delete(id))) {
      throw new BudgetServiceError('This budget no longer exists.');
    }
  }

  public getStatus(usagePercentage: number): BudgetProgress['status'] {
    return getBudgetStatus(usagePercentage);
  }

  private toProgress(budget: Budget, category: Category | null, spent: number): BudgetProgress {
    const usagePercentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    return {
      ...budget,
      category,
      spent,
      remaining: budget.amount - spent,
      usagePercentage,
      status: getBudgetStatus(usagePercentage),
    };
  }

  private async validateInput(input: CreateBudgetInput): Promise<void> {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(input.month)) {
      throw new BudgetServiceError('Choose a valid budget month.');
    }
    if (!Number.isSafeInteger(input.amount) || input.amount <= 0) {
      throw new BudgetServiceError('Budget must be a positive whole number.');
    }
    if (input.categoryId) {
      const category = await this.categories.getById(input.categoryId);
      if (!category || category.type !== 'expense') {
        throw new BudgetServiceError('Budgets can only use expense categories.');
      }
    }
  }

  private async ensureScopeIsUnique(input: CreateBudgetInput, excludingId?: string): Promise<void> {
    const existing = await this.budgets.list(input.month);
    const duplicate = existing.some((budget) => budget.categoryId === (input.categoryId ?? null) && budget.id !== excludingId);
    if (duplicate) {
      throw new BudgetServiceError('A budget already exists for this month and scope.');
    }
  }
}
