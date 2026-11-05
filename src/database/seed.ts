import type { SQLiteDatabase } from 'expo-sqlite';
import type { TransactionType } from '../types/common';

type DefaultCategory = {
  id: string;
  name: string;
  icon: string;
  type: TransactionType;
};

const defaultCategories: readonly DefaultCategory[] = [
  { id: '11111111-1111-4111-8111-111111111111', name: 'Food & Drinks', icon: '🍜', type: 'expense' },
  { id: '22222222-2222-4222-8222-222222222222', name: 'Transportation', icon: '🚌', type: 'expense' },
  { id: '33333333-3333-4333-8333-333333333333', name: 'Accommodation', icon: '🏠', type: 'expense' },
  { id: '44444444-4444-4444-8444-444444444444', name: 'Utilities', icon: '💡', type: 'expense' },
  { id: '55555555-5555-4555-8555-555555555555', name: 'Internet & Phone', icon: '📱', type: 'expense' },
  { id: '66666666-6666-4666-8666-666666666666', name: 'Shopping', icon: '🛍️', type: 'expense' },
  { id: '77777777-7777-4777-8777-777777777777', name: 'Healthcare', icon: '🩺', type: 'expense' },
  { id: '88888888-8888-4888-8888-888888888888', name: 'Education', icon: '📚', type: 'expense' },
  { id: '99999999-9999-4999-8999-999999999999', name: 'Entertainment', icon: '🎬', type: 'expense' },
  { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', name: 'Other', icon: '•••', type: 'expense' },
  { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', name: 'Salary', icon: '💼', type: 'income' },
  { id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', name: 'Allowance', icon: '💰', type: 'income' },
  { id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', name: 'Freelance', icon: '🧑‍💻', type: 'income' },
  { id: 'f1111111-1111-4111-8111-111111111111', name: 'Family Support', icon: '🤝', type: 'income' },
  { id: 'f2222222-2222-4222-8222-222222222222', name: 'Personal Savings', icon: '🏦', type: 'income' },
  { id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', name: 'Other Income', icon: '➕', type: 'income' },
];

export async function seedDefaultCategories(database: SQLiteDatabase): Promise<void> {
  for (const category of defaultCategories) {
    await database.runAsync(
      `INSERT OR IGNORE INTO categories (id, name, icon, type, is_default)
       VALUES (?, ?, ?, ?, 1)`,
      category.id,
      category.name,
      category.icon,
      category.type,
    );
  }
}
