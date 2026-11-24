import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Screen } from '@/components/shared/Screen';
import {
  formValuesToTransactionInput,
  TransactionForm,
  type TransactionFormValues,
  TransactionService,
  useTransactionCategories,
  useBankNames,
} from '@/features/transactions';

import { SqliteCategoryRepository } from '@/database/repositories/category.repository';
import { SqliteTransactionRepository } from '@/database/repositories/transaction.repository';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { fontFamily } from '@/theme/typography';
import type { Transaction } from '@/types/common';

export default function EditTransactionScreen(): React.JSX.Element {
  const router = useRouter();
  const database = useSQLiteContext();
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { categories, loading: categoriesLoading, error: categoryError } = useTransactionCategories();
  const bankNames = useBankNames();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      if (!id) {
        setError('Transaction not found.');
        setLoading(false);
        return;
      }
      try {
        const nextTransaction = await new SqliteTransactionRepository(database).getById(id);
        if (!nextTransaction) {
          setError('Transaction not found.');
        } else {
          setTransaction(nextTransaction);
        }
      } catch {
        setError('Transaction could not be loaded.');
      } finally {
        setLoading(false);
      }
    })();
  }, [database, id]);

  const handleSubmit = useCallback(async (values: TransactionFormValues): Promise<void> => {
    if (!id) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const service = new TransactionService(
        new SqliteTransactionRepository(database),
        new SqliteCategoryRepository(database),
      );
      await service.update(id, formValuesToTransactionInput(values));
      router.back();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Transaction could not be updated.');
    } finally {
      setSubmitting(false);
    }
  }, [database, id, router]);

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Go back" accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}><ArrowLeft color={colors.text} size={22} /></Pressable>
        <Text style={styles.title}>Edit transaction</Text>
        <View style={styles.headerSpacer} />
      </View>
      {loading || categoriesLoading ? <Text style={styles.status}>Loading transaction…</Text> : null}
      {categoryError ? <Text style={styles.error}>{categoryError}</Text> : null}
      {error && !transaction ? <Text style={styles.error}>{error}</Text> : null}
      {transaction ? (
        <TransactionForm
          key={transaction.id}
          categories={categories}
          bankNames={bankNames}
          error={error}
          initialValues={{ type: transaction.type, amount: String(transaction.amount), categoryId: transaction.categoryId, sourceType: transaction.sourceType ?? undefined, bankName: transaction.bankName ?? '', date: transaction.date, note: transaction.note ?? '' }}
          onSubmit={handleSubmit}
          submitLabel="Save changes"
          submitting={submitting}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', flexDirection: 'row', paddingHorizontal: spacing.screenHorizontal, paddingTop: spacing.sm },
  backButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  headerSpacer: { width: 40 },
  title: { color: colors.text, flex: 1, fontFamily: fontFamily.bold, fontSize: 20, textAlign: 'center' },
  status: { color: colors.textMuted, fontFamily: fontFamily.regular, paddingHorizontal: spacing.screenHorizontal, paddingTop: spacing.screenTop },
  error: { color: colors.expense, fontFamily: fontFamily.regular, paddingHorizontal: spacing.screenHorizontal, paddingTop: spacing.screenTop },
});
