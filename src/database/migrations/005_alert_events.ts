import type { Migration } from '@/database/schema';

export const alertEventsMigration: Migration = {
  version: 5,
  name: 'alert_events',
  up: async (database) => {
    await database.execAsync(`
      CREATE TABLE alert_events (
        key TEXT PRIMARY KEY NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
  },
};
