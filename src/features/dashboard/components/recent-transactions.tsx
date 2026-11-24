import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatMMK } from '@/lib/currency';
import { formatDisplayDate } from '@/lib/date';
import { moneySourceLabel } from '@/lib/money-source';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';
import { fontFamily } from '@/theme/typography';
import type { RecentTransactionRow } from '@/database/repositories/analytics.repository';

type RecentTransactionsProps = {
  transactions: readonly RecentTransactionRow[];
  onTransactionPress: (id: string) => void;
  onViewAll: () => void;
  onAddTransaction: () => void;
};

export function RecentTransactions({ transactions, onTransactionPress, onViewAll, onAddTransaction }: RecentTransactionsProps): React.JSX.Element {
  return <View style={styles.wrap}>
    <View style={styles.header}><Text style={styles.title}>Recent activity</Text><Pressable accessibilityRole="button" onPress={onViewAll} style={styles.viewAllButton}><Text style={styles.viewAll}>See all</Text><ChevronRight color={colors.forest} size={16} /></Pressable></View>
    {transactions.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>No transactions yet</Text><Text style={styles.emptyText}>Your latest income and expenses will appear here.</Text><Pressable accessibilityRole="button" onPress={onAddTransaction} style={styles.emptyButton}><Text style={styles.emptyButtonText}>Add a transaction</Text></Pressable></View> : <View style={styles.list}>{transactions.map((transaction, index) => <Pressable accessibilityRole="button" key={transaction.id} onPress={() => onTransactionPress(transaction.id)} style={({ pressed }) => [styles.row, index < transactions.length - 1 && styles.rowDivider, pressed && styles.pressed]}><View style={[styles.icon, transaction.type === 'income' ? styles.incomeIcon : styles.expenseIcon]}><Text style={styles.iconText}>{transaction.categoryIcon}</Text></View><View style={styles.main}><Text numberOfLines={1} style={styles.category}>{transaction.categoryName}</Text><Text numberOfLines={1} style={styles.note}>{moneySourceLabel(transaction.sourceType, transaction.bankName)} · {transaction.note || formatDisplayDate(transaction.date)}</Text></View><View style={styles.amountWrap}><Text adjustsFontSizeToFit minimumFontScale={0.7} numberOfLines={1} style={[styles.amount, { color: transaction.type === 'income' ? colors.income : colors.expense }]}>{transaction.type === 'income' ? '+' : '-'}{formatMMK(transaction.amount)}</Text></View><ChevronRight color={colors.textMuted} size={16} /></Pressable>)}</View>}
  </View>;
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.lg },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  title: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 17 },
  viewAllButton: { alignItems: 'center', flexDirection: 'row', minHeight: 48 },
  viewAll: { color: colors.forest, fontFamily: fontFamily.semiBold, fontSize: 13 },
  empty: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, padding: spacing.md },
  emptyTitle: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 15 },
  emptyText: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 19, marginTop: spacing.xs },
  emptyButton: { alignSelf: 'flex-start', backgroundColor: colors.forest, borderRadius: radii.sm, justifyContent: 'center', marginTop: spacing.md, minHeight: 48, paddingHorizontal: spacing.md },
  emptyButtonText: { color: colors.white, fontFamily: fontFamily.semiBold, fontSize: 12 },
  list: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, paddingHorizontal: spacing.md },
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, minHeight: 66, paddingVertical: spacing.sm },
  rowDivider: { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
  pressed: { opacity: 0.7 },
  icon: { alignItems: 'center', borderRadius: radii.sm, height: 36, justifyContent: 'center', width: 36 },
  incomeIcon: { backgroundColor: '#E5F4EB' },
  expenseIcon: { backgroundColor: '#FDECEC' },
  iconText: { fontSize: 19 },
  main: { flex: 1, minWidth: 0 },
  category: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 14 },
  note: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 12, marginTop: 3 },
  amountWrap: { alignItems: 'flex-end', maxWidth: '42%' },
  amount: { fontFamily: fontFamily.bold, fontSize: 12, fontVariant: ['tabular-nums'] },
});
