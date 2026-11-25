import type { SQLiteDatabase } from 'expo-sqlite';

export class SqliteAlertEventRepository {
  public constructor(private readonly database: SQLiteDatabase) {}

  public async claim(key: string): Promise<boolean> {
    const result = await this.database.runAsync('INSERT OR IGNORE INTO alert_events (key, created_at) VALUES (?, ?)', key, new Date().toISOString());
    return result.changes > 0;
  }

  public async release(key: string): Promise<void> {
    await this.database.runAsync('DELETE FROM alert_events WHERE key = ?', key);
  }

  public async clear(): Promise<void> {
    await this.database.runAsync('DELETE FROM alert_events');
  }
}
