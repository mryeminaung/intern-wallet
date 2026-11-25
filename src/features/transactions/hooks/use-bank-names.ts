import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SqliteTransactionRepository } from '@/database/repositories/transaction.repository';

export function useBankNames(): readonly string[] {
  const database = useSQLiteContext();
  const [bankNames, setBankNames] = useState<readonly string[]>([]);
  const refresh = useCallback(async () => {
    try { setBankNames(await new SqliteTransactionRepository(database).getBankNames()); }
    catch { setBankNames([]); }
  }, [database]);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  return bankNames;
}
