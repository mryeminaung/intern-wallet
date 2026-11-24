import type { Migration } from '@/database/schema';
import { initialSchemaSql } from '@/database/schema';

export const initialMigration: Migration = {
  version: 1,
  name: 'initial',
  up: async (database) => {
    await database.execAsync(initialSchemaSql);
  },
};
