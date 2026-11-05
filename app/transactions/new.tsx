import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Screen } from '../../src/components/shared/Screen';
import { TransactionForm } from '../../src/features/transactions/components/transaction-form';
import { useTransactionCategories } from '../../src/features/transactions/hooks/use-transaction-categories';
import { formValuesToTransactionInput, type TransactionFormValues } from '../../src/features/transactions/schemas/transaction.schema';
import { TransactionService } from '../../src/features/transactions/services/transaction.service';
import { SqliteCategoryRepository } from '../../src/database/repositories/category.repository';
import { SqliteTransactionRepository } from '../../src/database/repositories/transaction.repository';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { fontFamily } from '../../src/theme/typography';

export default function NewTransactionScreen(): React.JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string | string[] }>();
  const database = useSQLiteContext();
  const { categories, loading, error: categoryError } = useTransactionCategories();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: TransactionFormValues): Promise<void> => {
    setSubmitting(true);
    setError(null);
    try {
      const service = new TransactionService(
        new SqliteTransactionRepository(database),
        new SqliteCategoryRepository(database),
      );
      await service.create(formValuesToTransactionInput(values));
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
        <Text style={styles.title}>Add transaction</Text>
        <View style={styles.headerSpacer} />
      </View>
      {loading ? <Text style={styles.status}>Loading categories…</Text> : null}
      {categoryError ? <Text style={styles.error}>{categoryError}</Text> : null}
      <TransactionForm categories={categories} error={error} initialValues={{ type: params.type === 'income' ? 'income' : 'expense' }} onSubmit={handleSubmit} submitLabel="Save transaction" submitting={submitting} />
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
