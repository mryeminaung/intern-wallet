import { daysBetween, effectiveDaysForPeriod, formatMonth, monthPeriod, periodForMonth, type DatePeriod } from '../../../lib/date';
import type { AnalyticsRepository, CategorySpendingRow, DailySpendingRow, ExpenseTransactionRow, MonthlySpendingRow } from '../../../database/repositories/analytics.repository';
import type { BudgetRepository } from '../../../database/repositories/budget.repository';
import type { BudgetStatus } from '../../../types/common';

export type ReportCategory = CategorySpendingRow & { percentage: number };

export type ReportBudget = {
  month: string;
  totalBudget: number;
  actualSpending: number;
  remaining: number;
  usagePercentage: number;
  status: BudgetStatus;
};

export type ReportsData = {
  period: DatePeriod;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  averageDailySpending: number;
  highestSpendingCategory: ReportCategory | null;
  lowestSpendingCategory: ReportCategory | null;
  categories: readonly ReportCategory[];
  incomeSources: readonly ReportCategory[];
  dailySpending: readonly DailySpendingRow[];
  monthlySpending: readonly MonthlySpendingRow[];
  savingsRate: number | null;
  highestExpense: ExpenseTransactionRow | null;
  previousPeriodExpenses: number;
  previousPeriodChangePercentage: number | null;
  budget: ReportBudget | null;
  insights: readonly string[];
};

export class ReportsService {
  public constructor(
    private readonly analytics: AnalyticsRepository,
    private readonly budgets: BudgetRepository,
  ) {}

  public async getReport(period: DatePeriod): Promise<ReportsData> {
    if (new Date(period.fromDate).getTime() > new Date(period.toDate).getTime()) {
      throw new Error('The report start date must be before its end date.');
    }
    const previousPeriod = getPreviousPeriod(period);
    const [totals, categories, incomeSources, dailySpending, monthlySpending, highestExpense, previousTotals, budgetRows] = await Promise.all([
      this.analytics.getTotals(period.fromDate, period.toDate),
      this.analytics.getCategorySpending(period.fromDate, period.toDate),
      this.analytics.getIncomeSourceBreakdown(period.fromDate, period.toDate),
      this.analytics.getDailySpending(period.fromDate, period.toDate),
      this.analytics.getMonthlySpending(period.fromDate, period.toDate),
      this.analytics.getHighestExpense(period.fromDate, period.toDate),
      this.analytics.getTotals(previousPeriod.fromDate, previousPeriod.toDate),
      period.budgetMonth ? this.budgets.list(period.budgetMonth) : Promise.resolve([]),
    ]);
    const reportCategories = categories.map((category) => ({ ...category, percentage: totals.expenses > 0 ? (category.amount / totals.expenses) * 100 : 0 }));
    const reportIncomeSources = incomeSources.map((category) => ({ ...category, percentage: totals.income > 0 ? (category.amount / totals.income) * 100 : 0 }));
    const completeMonthlySpending = fillMonthlySpending(period, monthlySpending);
    const previousPeriodChangePercentage = previousTotals.expenses > 0
      ? ((totals.expenses - previousTotals.expenses) / previousTotals.expenses) * 100
      : null;
    const savingsRate = totals.income > 0 ? ((totals.income - totals.expenses) / totals.income) * 100 : null;
    const budget = buildBudgetPerformance(period.budgetMonth, budgetRows, totals.expenses);
    const insights = await this.buildInsights(period, totals.income, totals.expenses, reportCategories, previousTotals.expenses, previousPeriodChangePercentage, highestExpense, budget);
    return {
      period,
      totalIncome: totals.income,
      totalExpenses: totals.expenses,
      netSavings: totals.income - totals.expenses,
      averageDailySpending: totals.expenses / effectiveDaysForPeriod(period.fromDate, period.toDate),
      highestSpendingCategory: reportCategories[0] ?? null,
      lowestSpendingCategory: reportCategories[reportCategories.length - 1] ?? null,
      categories: reportCategories,
      incomeSources: reportIncomeSources,
      dailySpending,
      monthlySpending: completeMonthlySpending,
      savingsRate,
      highestExpense,
      previousPeriodExpenses: previousTotals.expenses,
      previousPeriodChangePercentage,
      budget,
      insights,
    };
  }

  private async buildInsights(period: DatePeriod, income: number, expenses: number, categories: readonly ReportCategory[], previousExpenses: number, previousChange: number | null, highestExpense: ExpenseTransactionRow | null, budget: ReportBudget | null): Promise<readonly string[]> {
    if (expenses === 0 && income === 0) {
      return ['Add income or expenses to start seeing insights.'];
    }
    const insights: string[] = [];
    const highest = categories[0];
    if (highest) {
      insights.push(`${highest.categoryName} is your highest spending category at ${Math.round(highest.percentage)}% of expenses.`);
    }
    if (expenses > 0) {
      insights.push(`Your average daily spending is ${Math.round(expenses / effectiveDaysForPeriod(period.fromDate, period.toDate)).toLocaleString()} MMK.`);
    }
    if (previousExpenses > 0 && previousChange !== null) {
      insights.push(`Spending ${previousChange >= 0 ? 'increased' : 'decreased'} ${Math.abs(Math.round(previousChange))}% compared with the previous period.`);
    }
    if (highestExpense) {
      insights.push(`Your largest expense was ${highestExpense.categoryName} at ${highestExpense.amount.toLocaleString()} MMK.`);
    }
    if (budget?.status === 'exceeded') {
      insights.push('Your overall monthly budget has been exceeded.');
    }
    return insights;
  }
}

export function currentReportPeriod(): DatePeriod {
  return monthPeriod();
}

export function previousReportPeriod(): DatePeriod {
  return monthPeriod(-1);
}

export function reportPeriodForMonth(month: string): DatePeriod {
  return periodForMonth(month);
}

function fillMonthlySpending(period: DatePeriod, rows: readonly MonthlySpendingRow[]): readonly MonthlySpendingRow[] {
  const existing = new Map(rows.map((row) => [row.month, row]));
  const result: MonthlySpendingRow[] = [];
  const start = new Date(period.fromDate);
  const end = new Date(period.toDate);
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= endMonth) {
    const month = formatMonth(cursor);
    result.push(existing.get(month) ?? { month, income: 0, expenses: 0 });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return result;
}

function getPreviousPeriod(period: DatePeriod): DatePeriod {
  if (period.budgetMonth) return monthPeriod(-1, new Date(period.fromDate));
  const from = new Date(period.fromDate).getTime();
  const duration = new Date(period.toDate).getTime() - from;
  const previousTo = new Date(from - 1);
  const previousFrom = new Date(previousTo.getTime() - duration);
  return { fromDate: previousFrom.toISOString(), toDate: previousTo.toISOString(), label: 'Previous period' };
}

function buildBudgetPerformance(month: string | undefined, rows: readonly { amount: number; categoryId: string | null }[], actualSpending: number): ReportBudget | null {
  if (!month || rows.length === 0) return null;
  const overall = rows.find((row) => row.categoryId === null);
  const totalBudget = overall?.amount ?? rows.reduce((sum, row) => sum + row.amount, 0);
  if (totalBudget <= 0) return null;
  const usagePercentage = (actualSpending / totalBudget) * 100;
  const status: BudgetStatus = usagePercentage >= 100 ? 'exceeded' : usagePercentage >= 90 ? 'almost-exhausted' : usagePercentage >= 70 ? 'approaching' : 'normal';
  return { month, totalBudget, actualSpending, remaining: totalBudget - actualSpending, usagePercentage, status };
}
