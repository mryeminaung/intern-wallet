import type { Migration } from '@/database/schema';

export const transfersMigration: Migration = {
  version: 4,
  name: 'transfers',
  up: async (database) => {
    await database.execAsync(`
      CREATE TABLE transfers (
        id TEXT PRIMARY KEY NOT NULL,
        from_source_key TEXT NOT NULL,
        to_source_key TEXT NOT NULL,
        amount INTEGER NOT NULL CHECK (amount > 0),
        note TEXT,
        date TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        CHECK (from_source_key <> to_source_key)
      );
      CREATE INDEX idx_transfers_date ON transfers (date DESC);
      CREATE INDEX idx_transfers_from ON transfers (from_source_key);
      CREATE INDEX idx_transfers_to ON transfers (to_source_key);
    `);
  },
};
