import { useCallback, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { SqliteAnalyticsRepository } from '../../../database/repositories/analytics.repository';
import { SqliteBudgetRepository } from '../../../database/repositories/budget.repository';
import { DashboardService, type DashboardData } from '../services/dashboard.service';

export function useDashboard(): {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const database = useSQLiteContext();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await new DashboardService(new SqliteAnalyticsRepository(database), new SqliteBudgetRepository(database)).getDashboard());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Dashboard could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [database]);
  return { data, loading, error, refresh };
}
