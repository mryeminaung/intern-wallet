import type { SQLiteDatabase } from 'expo-sqlite';
import { SqliteSettingsRepository } from '../src/database/repositories/settings.repository';

describe('SqliteSettingsRepository.setMany', () => {
  it('saves settings inside one transaction using bound parameters', async () => {
    const runAsync = jest.fn(async (_sql: string, _key: string, _value: string) => ({}));
    const withTransactionAsync = jest.fn(async (task: () => Promise<void>) => task());
    const database = { runAsync, withTransactionAsync } as unknown as SQLiteDatabase;
    const settings = new SqliteSettingsRepository(database);

    await settings.setMany([
      { key: 'dailyBudgetLimit', value: '15000' },
      { key: 'internshipStartDate', value: '2026-11-01' },
      { key: 'internshipEndDate', value: '2027-02-28' },
    ]);

    expect(withTransactionAsync).toHaveBeenCalledTimes(1);
    expect(runAsync).toHaveBeenCalledTimes(3);
    expect(runAsync.mock.calls[0][0]).toContain('VALUES (?, ?)');
    expect(runAsync.mock.calls[0].slice(1)).toEqual(['dailyBudgetLimit', '15000']);
  });

  it('propagates a failed write to SQLite so the transaction rolls back', async () => {
    const runAsync = jest.fn(async (_sql: string, key: string, _value: string) => {
      if (key === 'internshipStartDate') throw new Error('write failed');
      return {};
    });
    const withTransactionAsync = jest.fn(async (task: () => Promise<void>) => task());
    const database = { runAsync, withTransactionAsync } as unknown as SQLiteDatabase;
    const settings = new SqliteSettingsRepository(database);

    await expect(settings.setMany([
      { key: 'dailyBudgetLimit', value: '15000' },
      { key: 'internshipStartDate', value: '2026-11-01' },
      { key: 'internshipEndDate', value: '2027-02-28' },
    ])).rejects.toThrow('write failed');
    expect(withTransactionAsync).toHaveBeenCalledTimes(1);
    expect(runAsync).toHaveBeenCalledTimes(2);
  });
});
