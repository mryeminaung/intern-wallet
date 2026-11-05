import * as SQLite from 'expo-sqlite';
import { DATABASE_NAME } from '../lib/constants';
import { initialMigration } from './migrations/001_initial';
import { budgetScopeIndexesMigration } from './migrations/002_budget_scope_indexes';
import { seedDefaultCategories } from './seed';
import { setDisplayDateFormat } from '../lib/date';
import { setCurrencyDisplay } from '../lib/currency';
import { settingKeys } from '../lib/constants';
import type { Migration } from './schema';

const migrations: readonly Migration[] = [initialMigration, budgetScopeIndexesMigration];

export async function initializeDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync('PRAGMA foreign_keys = ON;');
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const appliedMigrations = await database.getAllAsync<{ version: number }>(
    'SELECT version FROM schema_migrations ORDER BY version ASC',
  );
  const appliedVersions = new Set(appliedMigrations.map((migration) => migration.version));

  for (const migration of migrations) {
    if (appliedVersions.has(migration.version)) {
      continue;
    }

    await database.withTransactionAsync(async () => {
      await migration.up(database);
      await database.runAsync(
        'INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)',
        migration.version,
        migration.name,
        new Date().toISOString(),
      );
    });
  }

  await seedDefaultCategories(database);
  const preferences = await database.getAllAsync<{ key: string; value: string }>(
    'SELECT key, value FROM settings WHERE key IN (?, ?)',
    settingKeys.dateFormat,
    settingKeys.currencyDisplay,
  );
  setDisplayDateFormat(preferences.find((item) => item.key === settingKeys.dateFormat)?.value ?? null);
  setCurrencyDisplay(preferences.find((item) => item.key === settingKeys.currencyDisplay)?.value ?? null);
}

export async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  const database = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await initializeDatabase(database);
  return database;
}
