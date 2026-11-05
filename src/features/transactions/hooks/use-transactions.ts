import { useCallback, useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { SqliteTransactionRepository, type TransactionFilter } from '../../../database/repositories/transaction.repository';
import type { Transaction } from '../../../types/common';

export function useTransactions(filters: TransactionFilter): {
  transactions: readonly Transaction[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const database = useSQLiteContext();
  const [transactions, setTransactions] = useState<readonly Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const nextTransactions = await new SqliteTransactionRepository(database).getAll(filters);
      setTransactions(nextTransactions);
    } catch {
      setError('Transactions could not be loaded from local storage.');
    } finally {
      setLoading(false);
    }
  }, [database, filters.categoryId, filters.fromDate, filters.maxAmount, filters.minAmount, filters.search, filters.sort, filters.toDate, filters.type]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { transactions, loading, error, refresh };
}

export const useTransactionList = useTransactions;
