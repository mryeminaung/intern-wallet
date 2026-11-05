import { useCallback, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { SqliteAnalyticsRepository } from '../../../database/repositories/analytics.repository';
import { SqliteSettingsRepository } from '../../../database/repositories/settings.repository';
import { DailyBudgetService, type DailyBudgetSummary } from '../services/daily-budget.service';

export function useDailyBudget(): {
  data: DailyBudgetSummary | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const database = useSQLiteContext();
  const [data, setData] = useState<DailyBudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await new DailyBudgetService(new SqliteAnalyticsRepository(database), new SqliteSettingsRepository(database)).getSummary());
    } catch {
      setError('Daily budget information could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [database]);
  return { data, loading, error, refresh };
}
