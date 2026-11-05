import type { SQLiteDatabase } from 'expo-sqlite';

export type Migration = {
  version: number;
  name: string;
  up: (database: SQLiteDatabase) => Promise<void>;
};

export const initialSchemaSql = `
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1))
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount INTEGER NOT NULL CHECK (amount > 0),
    category_id TEXT NOT NULL,
    note TEXT,
    date TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories (id) ON UPDATE CASCADE ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY NOT NULL,
    month TEXT NOT NULL,
    category_id TEXT,
    amount INTEGER NOT NULL CHECK (amount > 0),
    FOREIGN KEY (category_id) REFERENCES categories (id) ON UPDATE CASCADE ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_categories_type ON categories (type);
  CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (date DESC);
  CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions (category_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_type_date ON transactions (type, date DESC);
  CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets (month);
  CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON budgets (category_id);
`;
