import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatMMK } from '../../../lib/currency';
import { formatDisplayDate } from '../../../lib/date';
import { colors } from '../../../theme/colors';
import { radii, shadows, spacing } from '../../../theme/spacing';
import { fontFamily } from '../../../theme/typography';
import type { RecentTransactionRow } from '../../../database/repositories/analytics.repository';

export function RecentTransactions({ transactions, onTransactionPress, onViewAll, onAddTransaction }: { transactions: readonly RecentTransactionRow[]; onTransactionPress: (id: string) => void; onViewAll: () => void; onAddTransaction: () => void }): React.JSX.Element {
  return <View style={styles.wrap}><View style={styles.header}><Text style={styles.title}>Recent transactions</Text><Pressable accessibilityRole="button" onPress={onViewAll}><Text style={styles.viewAll}>See all</Text></Pressable></View>{transactions.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>Your wallet is ready</Text><Text style={styles.emptyText}>Add your first transaction to start seeing your money story here.</Text><Pressable accessibilityRole="button" onPress={onAddTransaction} style={styles.emptyButton}><Text style={styles.emptyButtonText}>Add transaction</Text></Pressable></View> : transactions.map((transaction) => <Pressable accessibilityRole="button" key={transaction.id} onPress={() => onTransactionPress(transaction.id)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}><View style={[styles.icon, transaction.type === 'income' ? styles.incomeIcon : styles.expenseIcon]}><Text style={styles.iconText}>{transaction.categoryIcon}</Text></View><View style={styles.main}><Text numberOfLines={1} style={styles.category}>{transaction.categoryName}</Text><Text numberOfLines={1} style={styles.note}>{transaction.note || formatDisplayDate(transaction.date)}</Text></View><View style={styles.amountWrap}><Text style={[styles.amount, { color: transaction.type === 'income' ? colors.income : colors.expense }]}>{transaction.type === 'income' ? '+' : '-'}{formatMMK(transaction.amount)}</Text><ChevronRight color={colors.textMuted} size={15} /></View></Pressable>)}</View>;
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.xl },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  title: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 17 },
  viewAll: { color: colors.forest, fontFamily: fontFamily.semiBold, fontSize: 13 },
  empty: { backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.lg, ...shadows.soft },
  emptyTitle: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 15 },
  emptyText: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 19, marginTop: spacing.xs },
  emptyButton: { alignSelf: 'flex-start', backgroundColor: colors.forest, borderRadius: radii.sm, marginTop: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  emptyButtonText: { color: colors.white, fontFamily: fontFamily.semiBold, fontSize: 12 },
  row: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.md, flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm, padding: spacing.md, ...shadows.soft },
  pressed: { opacity: 0.78 },
  icon: { alignItems: 'center', borderRadius: radii.sm, height: 40, justifyContent: 'center', width: 40 },
  incomeIcon: { backgroundColor: '#E5F4EB' },
  expenseIcon: { backgroundColor: '#FDECEC' },
  iconText: { fontSize: 20 },
  main: { flex: 1, minWidth: 0 },
  category: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 14 },
  note: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 12, marginTop: 3 },
  amountWrap: { alignItems: 'flex-end', flexDirection: 'row', gap: 2 },
  amount: { fontFamily: fontFamily.bold, fontSize: 12, fontVariant: ['tabular-nums'] },
});
