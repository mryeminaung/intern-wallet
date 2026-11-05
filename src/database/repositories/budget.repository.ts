import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { Budget, CreateBudgetInput } from '../../types/common';

type BudgetRow = {
  id: string;
  month: string;
  category_id: string | null;
  amount: number;
};

export interface BudgetRepository {
  list(month?: string): Promise<readonly Budget[]>;
  getById(id: string): Promise<Budget | null>;
  create(input: CreateBudgetInput): Promise<Budget>;
  update(id: string, input: CreateBudgetInput): Promise<Budget | null>;
  delete(id: string): Promise<boolean>;
}

function mapBudget(row: BudgetRow): Budget {
  return {
    id: row.id,
    month: row.month,
    categoryId: row.category_id,
    amount: row.amount,
  };
}

export class SqliteBudgetRepository implements BudgetRepository {
  public constructor(private readonly database: SQLiteDatabase) {}

  public async list(month?: string): Promise<readonly Budget[]> {
    const rows = month
      ? await this.database.getAllAsync<BudgetRow>(
          'SELECT id, month, category_id, amount FROM budgets WHERE month = ? ORDER BY category_id ASC',
          month,
        )
      : await this.database.getAllAsync<BudgetRow>(
          'SELECT id, month, category_id, amount FROM budgets ORDER BY month DESC, category_id ASC',
        );

    return rows.map(mapBudget);
  }

  public async create(input: CreateBudgetInput): Promise<Budget> {
    const id = randomUUID();
    await this.database.runAsync(
      'INSERT INTO budgets (id, month, category_id, amount) VALUES (?, ?, ?, ?)',
      id,
      input.month,
      input.categoryId ?? null,
      input.amount,
    );

    const row = await this.database.getFirstAsync<BudgetRow>(
      'SELECT id, month, category_id, amount FROM budgets WHERE id = ?',
      id,
    );
    if (!row) {
      throw new Error('Budget was created but could not be read back.');
    }
    return mapBudget(row);
  }

  public async getById(id: string): Promise<Budget | null> {
    const row = await this.database.getFirstAsync<BudgetRow>(
      'SELECT id, month, category_id, amount FROM budgets WHERE id = ?',
      id,
    );
    return row ? mapBudget(row) : null;
  }

  public async update(id: string, input: CreateBudgetInput): Promise<Budget | null> {
    const result = await this.database.runAsync(
      `UPDATE budgets SET month = ?, category_id = ?, amount = ? WHERE id = ?`,
      input.month,
      input.categoryId ?? null,
      input.amount,
      id,
    );
    return result.changes > 0 ? this.getById(id) : null;
  }

  public async delete(id: string): Promise<boolean> {
    const result = await this.database.runAsync('DELETE FROM budgets WHERE id = ?', id);
    return result.changes > 0;
  }
}
