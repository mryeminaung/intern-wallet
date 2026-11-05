import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Screen } from '../../../src/components/shared/Screen';
import { TransactionForm } from '../../../src/features/transactions/components/transaction-form';
import { useTransactionCategories } from '../../../src/features/transactions/hooks/use-transaction-categories';
import { formValuesToTransactionInput, type TransactionFormValues } from '../../../src/features/transactions/schemas/transaction.schema';
import { TransactionService } from '../../../src/features/transactions/services/transaction.service';
import { SqliteCategoryRepository } from '../../../src/database/repositories/category.repository';
import { SqliteTransactionRepository } from '../../../src/database/repositories/transaction.repository';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import { fontFamily } from '../../../src/theme/typography';
import type { Transaction } from '../../../src/types/common';

export default function EditTransactionScreen(): React.JSX.Element {
  const router = useRouter();
  const database = useSQLiteContext();
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { categories, loading: categoriesLoading, error: categoryError } = useTransactionCategories();
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
          error={error}
          initialValues={{ type: transaction.type, amount: String(transaction.amount), categoryId: transaction.categoryId, date: transaction.date, note: transaction.note ?? '' }}
          onSubmit={handleSubmit}
          submitLabel="Save changes"
          submitting={submitting}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', flexDirection: 'row', paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  backButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  headerSpacer: { width: 40 },
  title: { color: colors.text, flex: 1, fontFamily: fontFamily.bold, fontSize: 20, textAlign: 'center' },
  status: { color: colors.textMuted, fontFamily: fontFamily.regular, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  error: { color: colors.expense, fontFamily: fontFamily.regular, padding: spacing.lg },
});
