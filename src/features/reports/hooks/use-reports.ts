import { useCallback, useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { SqliteAnalyticsRepository } from '../../../database/repositories/analytics.repository';
import { SqliteBudgetRepository } from '../../../database/repositories/budget.repository';
import type { DatePeriod } from '../../../lib/date';
import { ReportsService, type ReportsData } from '../services/reports.service';

export function useReports(period: DatePeriod): { data: ReportsData | null; loading: boolean; error: string | null; refresh: () => Promise<void> } {
  const database = useSQLiteContext();
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await new ReportsService(new SqliteAnalyticsRepository(database), new SqliteBudgetRepository(database)).getReport(period));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Reports could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [database, period.fromDate, period.toDate, period.label]);
  useEffect(() => { void refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}
