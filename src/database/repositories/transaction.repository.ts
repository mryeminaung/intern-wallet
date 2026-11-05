import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';
import { toIsoDate } from '../../lib/date';
import type {
  CreateTransactionInput,
  Transaction,
  TransactionType,
  UpdateTransactionInput,
} from '../../types/common';

export type TransactionFilter = {
  type?: TransactionType;
  categoryId?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  minAmount?: number;
  maxAmount?: number;
  sort?: TransactionSort;
};

export type TransactionSort = 'newest' | 'oldest' | 'highest' | 'lowest';

type TransactionRow = {
  id: string;
  type: TransactionType;
  amount: number;
  category_id: string;
  note: string | null;
  date: string;
  created_at: string;
  updated_at: string;
};

export interface TransactionRepository {
  getAll(filters?: TransactionFilter): Promise<readonly Transaction[]>;
  list(filters?: TransactionFilter): Promise<readonly Transaction[]>;
  getById(id: string): Promise<Transaction | null>;
  getByDateRange(fromDate: string, toDate: string): Promise<readonly Transaction[]>;
  getByCategory(categoryId: string): Promise<readonly Transaction[]>;
  search(query: string): Promise<readonly Transaction[]>;
  count(): Promise<number>;
  create(input: CreateTransactionInput): Promise<Transaction>;
  update(id: string, input: UpdateTransactionInput): Promise<Transaction | null>;
  delete(id: string): Promise<boolean>;
}

function mapTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    type: row.type,
    amount: row.amount,
    categoryId: row.category_id,
    note: row.note,
    date: row.date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const transactionColumns = 'id, type, amount, category_id, note, date, created_at, updated_at';
const transactionColumnsWithAlias = 't.id, t.type, t.amount, t.category_id, t.note, t.date, t.created_at, t.updated_at';

export class SqliteTransactionRepository implements TransactionRepository {
  public constructor(private readonly database: SQLiteDatabase) {}

  public async getAll(filters: TransactionFilter = {}): Promise<readonly Transaction[]> {
    const conditions: string[] = [];
    const parameters: (string | number)[] = [];

    if (filters.type) {
      conditions.push('t.type = ?');
      parameters.push(filters.type);
    }
    if (filters.categoryId) {
      conditions.push('t.category_id = ?');
      parameters.push(filters.categoryId);
    }
    if (filters.fromDate) {
      conditions.push('t.date >= ?');
      parameters.push(filters.fromDate);
    }
    if (filters.toDate) {
      conditions.push('t.date <= ?');
      parameters.push(filters.toDate);
    }
    if (filters.search?.trim()) {
      conditions.push("LOWER(COALESCE(t.note, '') || ' ' || COALESCE(c.name, '')) LIKE LOWER(?)");
      parameters.push(`%${filters.search.trim()}%`);
    }
    if (filters.minAmount !== undefined) {
      conditions.push('t.amount >= ?');
      parameters.push(filters.minAmount);
    }
    if (filters.maxAmount !== undefined) {
      conditions.push('t.amount <= ?');
      parameters.push(filters.maxAmount);
    }

    const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
    const orderBy = filters.sort === 'oldest'
      ? 't.date ASC, t.created_at ASC'
      : filters.sort === 'highest'
        ? 't.amount DESC, t.date DESC, t.created_at DESC'
        : filters.sort === 'lowest'
          ? 't.amount ASC, t.date DESC, t.created_at DESC'
          : 't.date DESC, t.created_at DESC';
    const rows = await this.database.getAllAsync<TransactionRow>(
      `SELECT ${transactionColumnsWithAlias} FROM transactions t
       INNER JOIN categories c ON c.id = t.category_id${whereClause}
       ORDER BY ${orderBy}`,
      ...parameters,
    );

    return rows.map(mapTransaction);
  }

  public list(filters: TransactionFilter = {}): Promise<readonly Transaction[]> {
    return this.getAll(filters);
  }

  public async getById(id: string): Promise<Transaction | null> {
    const row = await this.database.getFirstAsync<TransactionRow>(
      `SELECT ${transactionColumns} FROM transactions WHERE id = ?`,
      id,
    );
    return row ? mapTransaction(row) : null;
  }

  public getByDateRange(fromDate: string, toDate: string): Promise<readonly Transaction[]> {
    return this.getAll({ fromDate, toDate });
  }

  public getByCategory(categoryId: string): Promise<readonly Transaction[]> {
    return this.getAll({ categoryId });
  }

  public search(query: string): Promise<readonly Transaction[]> {
    return this.getAll({ search: query });
  }

  public async count(): Promise<number> {
    const row = await this.database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM transactions',
    );
    return row?.count ?? 0;
  }

  public async create(input: CreateTransactionInput): Promise<Transaction> {
    const id = randomUUID();
    const now = toIsoDate();
    await this.database.runAsync(
      `INSERT INTO transactions
        (id, type, amount, category_id, note, date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      input.type,
      input.amount,
      input.categoryId,
      input.note ?? null,
      input.date,
      now,
      now,
    );

    const transaction = await this.getById(id);
    if (!transaction) {
      throw new Error('Transaction was created but could not be read back.');
    }
    return transaction;
  }

  public async update(id: string, input: UpdateTransactionInput): Promise<Transaction | null> {
    const result = await this.database.runAsync(
      `UPDATE transactions
       SET type = ?, amount = ?, category_id = ?, note = ?, date = ?, updated_at = ?
       WHERE id = ?`,
      input.type,
      input.amount,
      input.categoryId,
      input.note ?? null,
      input.date,
      toIsoDate(),
      id,
    );

    if (result.changes === 0) {
      return null;
    }
    return this.getById(id);
  }

  public async delete(id: string): Promise<boolean> {
    const result = await this.database.runAsync('DELETE FROM transactions WHERE id = ?', id);
    return result.changes > 0;
  }
}
