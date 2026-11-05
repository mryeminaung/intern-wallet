import { useCallback, useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { SqliteCategoryRepository } from '../../../database/repositories/category.repository';
import type { Category, TransactionType } from '../../../types/common';

export function useTransactionCategories(type?: TransactionType): {
  categories: readonly Category[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const database = useSQLiteContext();
  const [categories, setCategories] = useState<readonly Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const nextCategories = await new SqliteCategoryRepository(database).list(type);
      setCategories(nextCategories);
    } catch {
      setError('Categories could not be loaded from local storage.');
    } finally {
      setLoading(false);
    }
  }, [database, type]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { categories, loading, error, refresh };
}
