import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Screen } from '@/components/shared/Screen';
import {
  formValuesToTransactionInput,
  TransactionForm,
  type TransactionFormValues,
  TransactionService,
  transactionToRepeatFormValues,
  useTransactionEntryCategories,
  useBankNames,
  usePreferredMoneySources,
} from '@/features/transactions';

import { SqliteCategoryRepository } from '@/database/repositories/category.repository';
import { SqliteTransactionRepository } from '@/database/repositories/transaction.repository';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { fontFamily } from '@/theme/typography';
import { useUiStore } from '@/stores/ui.store';
import { checkBudgetAlerts } from '@/features/alerts/check-budget-alerts';
import type { Transaction, TransactionType } from '@/types/common';

export default function NewTransactionScreen(): React.JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string | string[]; repeatId?: string | string[] }>();
  const database = useSQLiteContext();
  const { categories, recentCategoryIds, preferredCategoryIds, loading, error: categoryError } = useTransactionEntryCategories();
  const bankNames = useBankNames();
  const { sources: preferredSources, loading: sourcesLoading } = usePreferredMoneySources();
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
    return { type: requestedType, categoryId: preferredCategoryIds[requestedType] ?? '', sourceType: preferredSources[requestedType].sourceType, bankName: preferredSources[requestedType].bankName ?? '' };
  }, [preferredCategoryIds, preferredSources, repeatCategoryMissing, repeatTransaction, requestedType]);

  const handleSubmit = async (values: TransactionFormValues): Promise<void> => {
    setSubmitting(true);
    setError(null);
    try {
      const service = new TransactionService(
        new SqliteTransactionRepository(database),
        new SqliteCategoryRepository(database),
      );
      await service.create(formValuesToTransactionInput(values));
      void checkBudgetAlerts(database).catch(() => undefined);
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
      {!loading && !sourcesLoading && !repeatLoading && !repeatError && !categoryError ? <TransactionForm autoFocusAmount={!repeatTransaction} bankNames={bankNames} categories={categories} error={error} initialValues={initialValues} onSubmit={handleSubmit} preferredCategoryIds={preferredCategoryIds} preferredSources={preferredSources} recentCategoryIds={recentCategoryIds} submitLabel={repeatTransaction ? 'Save repeated transaction' : 'Save transaction'} submitting={submitting} /> : null}
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
  warning: { backgroundColor: '#FFF7E6', color: colors.warning, fontFamily: fontFamily.medium, marginHorizontal: spacing.screenHorizontal, marginTop: spacing.md, padding: spacing.sm },
});

function paramValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
