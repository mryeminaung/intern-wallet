import type { SQLiteDatabase } from 'expo-sqlite';
import { randomUUID } from 'expo-crypto';
import type { Category, TransactionType } from '../../types/common';

type CategoryRow = {
  id: string;
  name: string;
  icon: string;
  type: TransactionType;
  is_default: number;
};

export interface CategoryRepository {
  list(type?: TransactionType): Promise<readonly Category[]>;
  getById(id: string): Promise<Category | null>;
  create(name: string, icon: string, type: TransactionType): Promise<Category>;
  update(id: string, name: string, icon: string): Promise<Category | null>;
  delete(id: string): Promise<boolean>;
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    type: row.type,
    isDefault: row.is_default === 1,
  };
}

export class SqliteCategoryRepository implements CategoryRepository {
  public constructor(private readonly database: SQLiteDatabase) {}

  public async list(type?: TransactionType): Promise<readonly Category[]> {
    const rows = type
      ? await this.database.getAllAsync<CategoryRow>(
          'SELECT id, name, icon, type, is_default FROM categories WHERE type = ? ORDER BY is_default DESC, name ASC',
          type,
        )
      : await this.database.getAllAsync<CategoryRow>(
          'SELECT id, name, icon, type, is_default FROM categories ORDER BY type ASC, is_default DESC, name ASC',
        );

    return rows.map(mapCategory);
  }

  public async getById(id: string): Promise<Category | null> {
    const row = await this.database.getFirstAsync<CategoryRow>(
      'SELECT id, name, icon, type, is_default FROM categories WHERE id = ?',
      id,
    );
    return row ? mapCategory(row) : null;
  }

  public async create(name: string, icon: string, type: TransactionType): Promise<Category> {
    const id = randomUUID();
    await this.database.runAsync('INSERT INTO categories (id, name, icon, type, is_default) VALUES (?, ?, ?, ?, 0)', id, name, icon, type);
    const category = await this.getById(id);
    if (!category) throw new Error('Category could not be read after saving.');
    return category;
  }

  public async update(id: string, name: string, icon: string): Promise<Category | null> {
    const result = await this.database.runAsync('UPDATE categories SET name = ?, icon = ? WHERE id = ? AND is_default = 0', name, icon, id);
    return result.changes > 0 ? this.getById(id) : null;
  }

  public async delete(id: string): Promise<boolean> {
    const result = await this.database.runAsync(
      `DELETE FROM categories WHERE id = ? AND is_default = 0
       AND NOT EXISTS (SELECT 1 FROM transactions WHERE category_id = ?)
       AND NOT EXISTS (SELECT 1 FROM budgets WHERE category_id = ?)`,
      id, id, id,
    );
    return result.changes > 0;
  }
}
