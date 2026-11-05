import type { SQLiteDatabase } from 'expo-sqlite';
import type { WalletData } from '../../types/common';
import { SqliteCategoryRepository } from './category.repository';
import { SqliteTransactionRepository } from './transaction.repository';
import { SqliteBudgetRepository } from './budget.repository';
import { SqliteSettingsRepository } from './settings.repository';
import { seedDefaultCategories } from '../seed';

export class DataManagementRepository {
  public constructor(private readonly database: SQLiteDatabase) {}

  public async readAll(): Promise<WalletData> {
    const [categories, transactions, budgets, settings] = await Promise.all([
      new SqliteCategoryRepository(this.database).list(),
      new SqliteTransactionRepository(this.database).getAll(),
      new SqliteBudgetRepository(this.database).list(),
      new SqliteSettingsRepository(this.database).list(),
    ]);
    return { categories, transactions, budgets, settings };
  }

  public async replaceAll(data: WalletData): Promise<void> {
    await this.database.withTransactionAsync(async () => {
      await this.database.execAsync('DELETE FROM transactions; DELETE FROM budgets; DELETE FROM categories; DELETE FROM settings;');
      for (const category of data.categories) {
        await this.database.runAsync(
          'INSERT INTO categories (id, name, icon, type, is_default) VALUES (?, ?, ?, ?, ?)',
          category.id, category.name, category.icon, category.type, category.isDefault ? 1 : 0,
        );
      }
      await seedDefaultCategories(this.database);
      for (const transaction of data.transactions) {
        await this.database.runAsync(
          `INSERT INTO transactions (id, type, amount, category_id, note, date, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          transaction.id, transaction.type, transaction.amount, transaction.categoryId,
          transaction.note, transaction.date, transaction.createdAt, transaction.updatedAt,
        );
      }
      for (const budget of data.budgets) {
        await this.database.runAsync(
          'INSERT INTO budgets (id, month, category_id, amount) VALUES (?, ?, ?, ?)',
          budget.id, budget.month, budget.categoryId, budget.amount,
        );
      }
      for (const setting of data.settings) {
        await this.database.runAsync('INSERT INTO settings (key, value) VALUES (?, ?)', setting.key, setting.value);
      }
    });
  }
}
