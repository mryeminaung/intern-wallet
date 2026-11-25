import { useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { SqliteTransactionRepository } from '@/database/repositories/transaction.repository';
import type { MoneySourceType, TransactionType } from '@/types/common';

type Source = { sourceType: MoneySourceType; bankName: string | null };
type Sources = Record<TransactionType, Source>;
const cash: Source = { sourceType: 'cash', bankName: null };

export function usePreferredMoneySources(): { sources: Sources; loading: boolean } {
  const database = useSQLiteContext();
  const [sources, setSources] = useState<Sources>({ income: cash, expense: cash });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const repo = new SqliteTransactionRepository(database);
    void Promise.all([repo.getLastUsedSource('income'), repo.getLastUsedSource('expense')]).then(([income, expense]) => {
      if (active) setSources({ income: income ?? cash, expense: expense ?? cash });
    }).catch(() => undefined).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [database]);
  return { sources, loading };
}
