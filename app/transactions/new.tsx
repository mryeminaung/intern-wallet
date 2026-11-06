import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Screen } from '../../src/components/shared/Screen';
import { TransactionForm } from '../../src/features/transactions/components/transaction-form';
import { useTransactionEntryCategories } from '../../src/features/transactions/hooks/use-transaction-entry-categories';
import { formValuesToTransactionInput, transactionToRepeatFormValues, type TransactionFormValues } from '../../src/features/transactions/schemas/transaction.schema';
import { TransactionService } from '../../src/features/transactions/services/transaction.service';
import { SqliteCategoryRepository } from '../../src/database/repositories/category.repository';
import { SqliteTransactionRepository } from '../../src/database/repositories/transaction.repository';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { fontFamily } from '../../src/theme/typography';
import { useUiStore } from '../../src/stores/ui.store';
import type { Transaction, TransactionType } from '../../src/types/common';

export default function NewTransactionScreen(): React.JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string | string[]; repeatId?: string | string[] }>();
  const database = useSQLiteContext();
  const { categories, recentCategoryIds, preferredCategoryIds, loading, error: categoryError } = useTransactionEntryCategories();
  const showNotice = useUiStore((state) => state.showNotice);
  const repeatId = paramValue(params.repeatId);
  const requestedType: TransactionType = paramValue(params.type) === 'income' ? 'income' : 'expense';
  const [repeatTransaction, setRepeatTransaction] = useState<Transaction | null>(null);
  const [repeatLoading, setRepeatLoading] = useState(Boolean(repeatId));
  const [repeatError, setRepeatError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!repeatId) {
      setRepeatTransaction(null);
      setRepeatLoading(false);
      setRepeatError(null);
      return () => { active = false; };
    }
    setRepeatLoading(true);
    setRepeatError(null);
    void new SqliteTransactionRepository(database).getById(repeatId).then((transaction) => {
      if (!active) return;
      setRepeatTransaction(transaction);
      if (!transaction) setRepeatError('The original transaction could not be found.');
    }).catch(() => {
      if (active) setRepeatError('The original transaction could not be loaded.');
    }).finally(() => {
      if (active) setRepeatLoading(false);
    });
    return () => { active = false; };
  }, [database, repeatId]);

  const repeatCategoryMissing = Boolean(repeatTransaction && !categories.some((category) => category.id === repeatTransaction.categoryId && category.type === repeatTransaction.type));
  const initialValues = useMemo<Partial<TransactionFormValues>>(() => {
    if (repeatTransaction) {
      const values = transactionToRepeatFormValues(repeatTransaction);
      return repeatCategoryMissing ? { ...values, categoryId: '' } : values;
    }
    return { type: requestedType, categoryId: preferredCategoryIds[requestedType] ?? '' };
  }, [preferredCategoryIds, repeatCategoryMissing, repeatTransaction, requestedType]);

  const handleSubmit = async (values: TransactionFormValues): Promise<void> => {
    setSubmitting(true);
    setError(null);
    try {
      const service = new TransactionService(
        new SqliteTransactionRepository(database),
        new SqliteCategoryRepository(database),
      );
      await service.create(formValuesToTransactionInput(values));
      showNotice(repeatTransaction ? 'Transaction repeated' : values.type === 'income' ? 'Income saved' : 'Expense saved');
      router.replace('/transactions');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Transaction could not be saved.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Go back" accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={colors.text} size={22} />
        </Pressable>
        <Text style={styles.title}>{repeatId ? 'Repeat transaction' : 'Add transaction'}</Text>
        <View style={styles.headerSpacer} />
      </View>
      {loading ? <Text style={styles.status}>Loading categories…</Text> : null}
      {repeatLoading ? <Text style={styles.status}>Loading the original transaction…</Text> : null}
      {categoryError ? <Text style={styles.error}>{categoryError}</Text> : null}
      {repeatError ? <Text style={styles.error}>{repeatError}</Text> : null}
      {repeatCategoryMissing ? <Text style={styles.warning}>The original category is no longer available. Choose another category before saving.</Text> : null}
      {!loading && !repeatLoading && !repeatError && !categoryError ? <TransactionForm autoFocusAmount={!repeatTransaction} categories={categories} error={error} initialValues={initialValues} onSubmit={handleSubmit} preferredCategoryIds={preferredCategoryIds} recentCategoryIds={recentCategoryIds} submitLabel={repeatTransaction ? 'Save repeated transaction' : 'Save transaction'} submitting={submitting} /> : null}
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
  warning: { backgroundColor: '#FFF7E6', color: colors.warning, fontFamily: fontFamily.medium, marginHorizontal: spacing.lg, marginTop: spacing.md, padding: spacing.sm },
});

function paramValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
