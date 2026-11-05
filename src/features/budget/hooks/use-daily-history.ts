import { useCallback, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { SqliteAnalyticsRepository } from '../../../database/repositories/analytics.repository';
import { SqliteSettingsRepository } from '../../../database/repositories/settings.repository';
import { DailyBudgetService, type DailyBudgetHistory } from '../services/daily-budget.service';

export function useDailyHistory(monthDate: Date): {
  data: DailyBudgetHistory | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const database = useSQLiteContext();
  const [data, setData] = useState<DailyBudgetHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const service = new DailyBudgetService(new SqliteAnalyticsRepository(database), new SqliteSettingsRepository(database));
      setData(await service.getHistory(monthDate));
    } catch {
      setError('Daily history could not be loaded from this device.');
    } finally {
      setLoading(false);
    }
  }, [database, monthDate]);
  return { data, loading, error, refresh };
}
