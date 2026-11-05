import { useCallback, useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { SqliteAnalyticsRepository } from '../../../database/repositories/analytics.repository';
import { SqliteBudgetRepository } from '../../../database/repositories/budget.repository';
import { SqliteCategoryRepository } from '../../../database/repositories/category.repository';
import { BudgetService, type BudgetSummary } from '../services/budget.service';

export function useBudgets(month: string): {
  summary: BudgetSummary | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const database = useSQLiteContext();
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const service = new BudgetService(
        new SqliteBudgetRepository(database),
        new SqliteCategoryRepository(database),
        new SqliteAnalyticsRepository(database),
      );
      setSummary(await service.getSummary(month));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Budgets could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [database, month]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { summary, loading, error, refresh };
}
