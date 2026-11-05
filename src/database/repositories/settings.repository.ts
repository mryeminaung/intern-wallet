import type { SQLiteDatabase } from 'expo-sqlite';
import type { Setting } from '../../types/common';

export interface SettingsRepository {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  setMany(entries: readonly Setting[]): Promise<void>;
  list(): Promise<readonly Setting[]>;
}

export class SqliteSettingsRepository implements SettingsRepository {
  public constructor(private readonly database: SQLiteDatabase) {}

  public async get(key: string): Promise<string | null> {
    const row = await this.database.getFirstAsync<{ value: string }>(
      'SELECT value FROM settings WHERE key = ?',
      key,
    );
    return row?.value ?? null;
  }

  public async set(key: string, value: string): Promise<void> {
    await this.database.runAsync(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      key,
      value,
    );
  }

  public async setMany(entries: readonly Setting[]): Promise<void> {
    await this.database.withTransactionAsync(async () => {
      for (const { key, value } of entries) {
        await this.set(key, value);
      }
    });
  }

  public async list(): Promise<readonly Setting[]> {
    return this.database.getAllAsync<Setting>('SELECT key, value FROM settings ORDER BY key ASC');
  }
}
