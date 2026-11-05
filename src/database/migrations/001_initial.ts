import type { Migration } from '../schema';
import { initialSchemaSql } from '../schema';

export const initialMigration: Migration = {
  version: 1,
  name: 'initial',
  up: async (database) => {
    await database.execAsync(initialSchemaSql);
  },
};
