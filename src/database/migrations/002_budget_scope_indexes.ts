import type { Migration } from '../schema';

export const budgetScopeIndexesMigration: Migration = {
  version: 2,
  name: 'budget_scope_indexes',
  up: async (database) => {
    await database.execAsync(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_budgets_overall_month
        ON budgets (month)
        WHERE category_id IS NULL;

      CREATE UNIQUE INDEX IF NOT EXISTS idx_budgets_category_month
        ON budgets (month, category_id)
        WHERE category_id IS NOT NULL;
    `);
  },
};
