import type { SQLiteDatabase } from 'expo-sqlite';
import type { TransactionType } from '../../types/common';

export type PeriodTotals = {
  income: number;
  expenses: number;
};

export type CategorySpendingRow = {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  amount: number;
};

export type DailySpendingRow = {
  date: string;
  amount: number;
};

export type MonthlySpendingRow = {
  month: string;
  income: number;
  expenses: number;
};

export type RecentTransactionRow = {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  note: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseTransactionRow = RecentTransactionRow;

export interface AnalyticsRepository {
  getTotals(fromDate?: string, toDate?: string): Promise<PeriodTotals>;
  getCategorySpending(fromDate: string, toDate: string): Promise<readonly CategorySpendingRow[]>;
  getIncomeSourceBreakdown(fromDate: string, toDate: string): Promise<readonly CategorySpendingRow[]>;
  getDailySpending(fromDate: string, toDate: string): Promise<readonly DailySpendingRow[]>;
  getMonthlySpending(fromDate: string, toDate: string): Promise<readonly MonthlySpendingRow[]>;
  getHighestExpense(fromDate: string, toDate: string): Promise<ExpenseTransactionRow | null>;
  getRecentTransactions(limit: number): Promise<readonly RecentTransactionRow[]>;
}

export class SqliteAnalyticsRepository implements AnalyticsRepository {
  public constructor(private readonly database: SQLiteDatabase) {}

  public async getTotals(fromDate?: string, toDate?: string): Promise<PeriodTotals> {
    const conditions: string[] = [];
    const parameters: string[] = [];
    if (fromDate) {
      conditions.push('date >= ?');
      parameters.push(fromDate);
    }
    if (toDate) {
      conditions.push('date <= ?');
      parameters.push(toDate);
    }
    const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
    const row = await this.database.getFirstAsync<{ income: number | null; expenses: number | null }>(
      `SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expenses
       FROM transactions${whereClause}`,
      ...parameters,
    );
    return { income: row?.income ?? 0, expenses: row?.expenses ?? 0 };
  }

  public async getCategorySpending(fromDate: string, toDate: string): Promise<readonly CategorySpendingRow[]> {
    return this.database.getAllAsync<CategorySpendingRow>(
      `SELECT c.id AS categoryId, c.name AS categoryName, c.icon AS categoryIcon,
              COALESCE(SUM(t.amount), 0) AS amount
       FROM transactions t
       INNER JOIN categories c ON c.id = t.category_id
       WHERE t.type = 'expense' AND t.date >= ? AND t.date <= ?
       GROUP BY c.id, c.name, c.icon
       ORDER BY amount DESC`,
      fromDate,
      toDate,
    );
  }

  public async getIncomeSourceBreakdown(fromDate: string, toDate: string): Promise<readonly CategorySpendingRow[]> {
    return this.database.getAllAsync<CategorySpendingRow>(
      `SELECT c.id AS categoryId, c.name AS categoryName, c.icon AS categoryIcon,
              COALESCE(SUM(t.amount), 0) AS amount
       FROM transactions t
       INNER JOIN categories c ON c.id = t.category_id
       WHERE t.type = 'income' AND t.date >= ? AND t.date <= ?
       GROUP BY c.id, c.name, c.icon
       ORDER BY amount DESC`,
      fromDate,
      toDate,
    );
  }

  public async getDailySpending(fromDate: string, toDate: string): Promise<readonly DailySpendingRow[]> {
    return this.database.getAllAsync<DailySpendingRow>(
      `SELECT strftime('%Y-%m-%d', date, 'localtime') AS date, COALESCE(SUM(amount), 0) AS amount
       FROM transactions
       WHERE type = 'expense' AND date >= ? AND date <= ?
       GROUP BY strftime('%Y-%m-%d', date, 'localtime')
       ORDER BY date ASC`,
      fromDate,
      toDate,
    );
  }

  public async getMonthlySpending(fromDate: string, toDate: string): Promise<readonly MonthlySpendingRow[]> {
    return this.database.getAllAsync<MonthlySpendingRow>(
      `SELECT strftime('%Y-%m', date, 'localtime') AS month,
              COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
              COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expenses
       FROM transactions
       WHERE date >= ? AND date <= ?
       GROUP BY strftime('%Y-%m', date, 'localtime')
       ORDER BY month ASC`,
      fromDate,
      toDate,
    );
  }

  public async getHighestExpense(fromDate: string, toDate: string): Promise<ExpenseTransactionRow | null> {
    return this.database.getFirstAsync<ExpenseTransactionRow>(
      `SELECT t.id, t.type, t.amount, t.category_id AS categoryId,
              c.name AS categoryName, c.icon AS categoryIcon, t.note, t.date,
              t.created_at AS createdAt, t.updated_at AS updatedAt
       FROM transactions t
       INNER JOIN categories c ON c.id = t.category_id
       WHERE t.type = 'expense' AND t.date >= ? AND t.date <= ?
       ORDER BY t.amount DESC, t.date DESC, t.created_at DESC
       LIMIT 1`,
      fromDate,
      toDate,
    );
  }

  public async getRecentTransactions(limit: number): Promise<readonly RecentTransactionRow[]> {
    return this.database.getAllAsync<RecentTransactionRow>(
      `SELECT t.id, t.type, t.amount, t.category_id AS categoryId,
              c.name AS categoryName, c.icon AS categoryIcon, t.note, t.date,
              t.created_at AS createdAt, t.updated_at AS updatedAt
       FROM transactions t
       INNER JOIN categories c ON c.id = t.category_id
       ORDER BY t.date DESC, t.created_at DESC
       LIMIT ?`,
      limit,
    );
  }
}
