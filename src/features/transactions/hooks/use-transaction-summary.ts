import { useCallback, useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { SqliteAnalyticsRepository, type PeriodTotals } from '../../../database/repositories/analytics.repository';

export function useTransactionSummary(fromDate: string, toDate: string): {
  summary: PeriodTotals | null;
  loading: boolean;
  error: string | null;
} {
  const database = useSQLiteContext();
  const [summary, setSummary] = useState<PeriodTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSummary(await new SqliteAnalyticsRepository(database).getTotals(fromDate, toDate));
    } catch {
      setError('The monthly summary could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [database, fromDate, toDate]);

  useEffect(() => { void load(); }, [load]);

  return { summary, loading, error };
}
