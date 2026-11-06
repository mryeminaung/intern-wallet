import { useCallback, useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { SqliteCategoryRepository } from '../../../database/repositories/category.repository';
import type { Category, TransactionType } from '../../../types/common';

type CategoryIdsByType = Record<TransactionType, readonly string[]>;

const emptyRecentIds: CategoryIdsByType = { income: [], expense: [] };

export function useTransactionEntryCategories(): {
  categories: readonly Category[];
  recentCategoryIds: CategoryIdsByType;
  preferredCategoryIds: Partial<Record<TransactionType, string>>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const database = useSQLiteContext();
  const [categories, setCategories] = useState<readonly Category[]>([]);
  const [recentCategoryIds, setRecentCategoryIds] = useState<CategoryIdsByType>(emptyRecentIds);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await new SqliteCategoryRepository(database).listForTransactionEntry();
      const nextRecentIds: CategoryIdsByType = {
        income: rows.filter((category) => category.type === 'income' && category.lastUsedAt !== null).slice(0, 4).map((category) => category.id),
        expense: rows.filter((category) => category.type === 'expense' && category.lastUsedAt !== null).slice(0, 4).map((category) => category.id),
      };
      setCategories(rows);
      setRecentCategoryIds(nextRecentIds);
    } catch {
      setError('Categories could not be loaded from local storage.');
    } finally {
      setLoading(false);
    }
  }, [database]);

  useEffect(() => { void refresh(); }, [refresh]);

  return {
    categories,
    recentCategoryIds,
    preferredCategoryIds: { income: recentCategoryIds.income[0], expense: recentCategoryIds.expense[0] },
    loading,
    error,
    refresh,
  };
}
