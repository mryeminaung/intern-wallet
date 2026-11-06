import type { SQLiteDatabase } from 'expo-sqlite';
import { SqliteCategoryRepository } from '../src/database/repositories/category.repository';

describe('SqliteCategoryRepository.listForTransactionEntry', () => {
  it('requests categories ordered by their latest matching transaction use', async () => {
    const getAllAsync = jest.fn(async (_sql: string) => [
      { id: 'food', name: 'Food', icon: '🍜', type: 'expense', is_default: 1, last_used_at: '2026-11-06T10:00:00.000Z' },
      { id: 'transport', name: 'Transportation', icon: '🚌', type: 'expense', is_default: 1, last_used_at: null },
    ]);
    const repository = new SqliteCategoryRepository({ getAllAsync } as unknown as SQLiteDatabase);

    const categories = await repository.listForTransactionEntry();

    expect(getAllAsync).toHaveBeenCalledTimes(1);
    expect(getAllAsync.mock.calls[0][0]).toContain('MAX(t.created_at)');
    expect(getAllAsync.mock.calls[0][0]).toContain('t.type = c.type');
    expect(categories).toEqual([
      { id: 'food', name: 'Food', icon: '🍜', type: 'expense', isDefault: true, lastUsedAt: '2026-11-06T10:00:00.000Z' },
      { id: 'transport', name: 'Transportation', icon: '🚌', type: 'expense', isDefault: true, lastUsedAt: null },
    ]);
  });
});
