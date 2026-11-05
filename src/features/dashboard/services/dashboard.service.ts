import { daysBetween, formatMonth, monthPeriod } from '../../../lib/date';
import type { AnalyticsRepository, CategorySpendingRow, RecentTransactionRow } from '../../../database/repositories/analytics.repository';
import type { BudgetRepository } from '../../../database/repositories/budget.repository';

export type DashboardData = {
  balance: number;
  monthIncome: number;
  monthExpenses: number;
  totalBudget: number;
  remainingBudget: number;
  budgetUsagePercentage: number;
  dailyAverageSpending: number;
  highestSpendingCategory: CategorySpendingRow | null;
  previousMonthExpenses: number;
  previousMonthChangePercentage: number | null;
  recentTransactions: readonly RecentTransactionRow[];
};

export class DashboardService {
  public constructor(
    private readonly analytics: AnalyticsRepository,
    private readonly budgets: BudgetRepository,
  ) {}

  public async getDashboard(referenceDate: Date = new Date()): Promise<DashboardData> {
    const current = monthPeriod(0, referenceDate);
    const previous = monthPeriod(-1, referenceDate);
    const monthKey = formatMonth(referenceDate);
    const [allTime, currentTotals, previousTotals, categories, budgets, recentTransactions] = await Promise.all([
      this.analytics.getTotals(),
      this.analytics.getTotals(current.fromDate, current.toDate),
      this.analytics.getTotals(previous.fromDate, previous.toDate),
      this.analytics.getCategorySpending(current.fromDate, current.toDate),
      this.budgets.list(monthKey),
      this.analytics.getRecentTransactions(5),
    ]);
    const overallBudget = budgets.find((budget) => budget.categoryId === null);
    const totalBudget = overallBudget?.amount ?? budgets.reduce((sum, budget) => sum + budget.amount, 0);
    const daysElapsed = referenceDate.getMonth() === new Date().getMonth() && referenceDate.getFullYear() === new Date().getFullYear()
      ? referenceDate.getDate()
      : daysBetween(current.fromDate, current.toDate);
    return {
      balance: allTime.income - allTime.expenses,
      monthIncome: currentTotals.income,
      monthExpenses: currentTotals.expenses,
      totalBudget,
      remainingBudget: totalBudget - currentTotals.expenses,
      budgetUsagePercentage: totalBudget > 0 ? (currentTotals.expenses / totalBudget) * 100 : 0,
      dailyAverageSpending: currentTotals.expenses / Math.max(1, daysElapsed),
      highestSpendingCategory: categories[0] ?? null,
      previousMonthExpenses: previousTotals.expenses,
      previousMonthChangePercentage: previousTotals.expenses > 0
        ? ((currentTotals.expenses - previousTotals.expenses) / previousTotals.expenses) * 100
        : null,
      recentTransactions,
    };
  }
}
