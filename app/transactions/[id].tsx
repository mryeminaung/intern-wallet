import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CalendarDays, Pencil, Tag, Trash2 } from 'lucide-react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Screen } from '../../src/components/shared/Screen';
import { Surface } from '../../src/components/ui/Surface';
import { SqliteCategoryRepository } from '../../src/database/repositories/category.repository';
import { SqliteTransactionRepository } from '../../src/database/repositories/transaction.repository';
import { TransactionService } from '../../src/features/transactions/services/transaction.service';
import { formatMMK } from '../../src/lib/currency';
import { formatDisplayDate } from '../../src/lib/date';
import { colors } from '../../src/theme/colors';
import { radii, spacing } from '../../src/theme/spacing';
import { fontFamily } from '../../src/theme/typography';
import type { Category, Transaction } from '../../src/types/common';

export default function TransactionDetailsScreen(): React.JSX.Element {
  const router = useRouter();
  const database = useSQLiteContext();
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadTransaction = useCallback(async () => {
    if (!id) {
      setError('Transaction not found.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const transactionRepository = new SqliteTransactionRepository(database);
      const nextTransaction = await transactionRepository.getById(id);
      if (!nextTransaction) {
        setError('Transaction not found.');
        setTransaction(null);
        return;
      }
      setTransaction(nextTransaction);
      setCategory(await new SqliteCategoryRepository(database).getById(nextTransaction.categoryId));
    } catch {
      setError('Transaction could not be loaded from local storage.');
    } finally {
      setLoading(false);
    }
  }, [database, id]);

  useFocusEffect(useCallback(() => {
    void loadTransaction();
  }, [loadTransaction]));

  const confirmDelete = (): void => {
    if (!transaction || deleting) {
      return;
    }
    Alert.alert('Delete transaction?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { void deleteTransaction(); } },
    ]);
  };

  const deleteTransaction = async (): Promise<void> => {
    if (!id) {
      return;
    }
    setDeleting(true);
    try {
      await new TransactionService(
        new SqliteTransactionRepository(database),
        new SqliteCategoryRepository(database),
      ).delete(id);
      router.replace('/transactions');
    } catch {
      setError('Transaction could not be deleted.');
      setDeleting(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Go back" accessibilityRole="button" onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft color={colors.text} size={22} />
        </Pressable>
        <Text style={styles.headerTitle}>Transaction details</Text>
        <View style={styles.headerActions}>
          <Pressable accessibilityLabel="Edit transaction" accessibilityRole="button" disabled={!transaction} onPress={() => id && router.push(`/transactions/${id}/edit`)} style={styles.iconButton}>
            <Pencil color={colors.forest} size={19} />
          </Pressable>
          <Pressable accessibilityLabel="Delete transaction" accessibilityRole="button" disabled={!transaction || deleting} onPress={confirmDelete} style={styles.iconButton}>
            <Trash2 color={colors.expense} size={19} />
          </Pressable>
        </View>
      </View>

      {loading ? <Text style={styles.status}>Loading transaction…</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && transaction ? (
        <View style={styles.content}>
          <Surface>
            <View style={styles.typeRow}>
              <View style={[styles.typeBadge, transaction.type === 'income' ? styles.incomeBadge : styles.expenseBadge]}>
                <Text style={styles.typeBadgeText}>{transaction.type === 'income' ? 'INCOME' : 'EXPENSE'}</Text>
              </View>
              <Text style={[styles.amount, transaction.type === 'income' ? styles.incomeAmount : styles.expenseAmount]}>
                {transaction.type === 'income' ? '+' : '-'}{formatMMK(transaction.amount)}
              </Text>
            </View>
            <View style={styles.detailRow}><Tag color={colors.forest} size={19} /><Text style={styles.detailLabel}>Category</Text><Text style={styles.detailValue}>{category?.icon ?? '•'} {category?.name ?? 'Unknown'}</Text></View>
            <View style={styles.detailRow}><CalendarDays color={colors.forest} size={19} /><Text style={styles.detailLabel}>Date</Text><Text style={styles.detailValue}>{formatDisplayDate(transaction.date)}</Text></View>
            <View style={styles.noteBox}><Text style={styles.noteLabel}>Note</Text><Text style={styles.note}>{transaction.note || 'No note added.'}</Text></View>
          </Surface>
          <Text style={styles.savedAt}>Saved {formatDisplayDate(transaction.createdAt)}</Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', flexDirection: 'row', paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  iconButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  headerTitle: { color: colors.text, flex: 1, fontFamily: fontFamily.bold, fontSize: 19, textAlign: 'center' },
  headerActions: { flexDirection: 'row' },
  content: { padding: spacing.lg },
  status: { color: colors.textMuted, padding: spacing.lg },
  error: { backgroundColor: '#FCEDEA', borderRadius: radii.sm, color: colors.expense, margin: spacing.lg, padding: spacing.sm },
  typeRow: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, justifyContent: 'space-between', paddingBottom: spacing.lg },
  typeBadge: { borderRadius: 99, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  incomeBadge: { backgroundColor: '#E2F1E8' },
  expenseBadge: { backgroundColor: '#FCEDEA' },
  typeBadgeText: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 11, letterSpacing: 0.8 },
  amount: { fontFamily: fontFamily.bold, fontSize: 20, fontVariant: ['tabular-nums'] },
  incomeAmount: { color: colors.income },
  expenseAmount: { color: colors.expense },
  detailRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  detailLabel: { color: colors.textMuted, flex: 1, fontFamily: fontFamily.regular, fontSize: 14 },
  detailValue: { color: colors.text, fontFamily: fontFamily.medium, fontSize: 14, maxWidth: '60%', textAlign: 'right' },
  noteBox: { backgroundColor: colors.background, borderRadius: radii.sm, marginTop: spacing.xl, padding: spacing.md },
  noteLabel: { color: colors.textMuted, fontFamily: fontFamily.medium, fontSize: 12 },
  note: { color: colors.text, fontFamily: fontFamily.regular, fontSize: 15, lineHeight: 22, marginTop: spacing.xs },
  savedAt: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 12, marginTop: spacing.md, textAlign: 'center' },
});
