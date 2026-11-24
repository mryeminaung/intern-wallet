import type { Migration } from '@/database/schema';

export const moneySourcesMigration: Migration = {
  version: 3,
  name: 'money_sources',
  up: async (database) => {
    await database.execAsync(`
      ALTER TABLE transactions ADD COLUMN source_type TEXT CHECK (source_type IN ('cash', 'bank') OR source_type IS NULL);
      ALTER TABLE transactions ADD COLUMN bank_name TEXT;
      CREATE INDEX idx_transactions_source ON transactions (source_type, bank_name);
    `);
  },
};
