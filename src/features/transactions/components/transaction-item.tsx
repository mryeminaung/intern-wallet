import { ArrowDownLeft, ArrowUpRight, ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatMMK } from '../../../lib/currency';
import { colors } from '../../../theme/colors';
import { radii, shadows, spacing } from '../../../theme/spacing';
import { fontFamily } from '../../../theme/typography';
import type { Category, Transaction } from '../../../types/common';

type TransactionListItemProps = {
  transaction: Transaction;
  category?: Category;
  onPress: () => void;
};

export function TransactionListItem({ transaction, category, onPress }: TransactionListItemProps): React.JSX.Element {
  const isIncome = transaction.type === 'income';
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.item}>
      <View style={[styles.icon, isIncome ? styles.incomeIcon : styles.expenseIcon]}>
        {isIncome ? <ArrowUpRight color={colors.income} size={20} /> : <ArrowDownLeft color={colors.expense} size={20} />}
      </View>
      <View style={styles.main}>
        <Text numberOfLines={1} style={styles.category}>{category?.icon ?? '•'} {category?.name ?? 'Unknown category'}</Text>
        <Text numberOfLines={1} style={styles.note}>{transaction.note || 'No note'}</Text>
      </View>
      <View style={styles.amountWrap}>
        <Text style={[styles.amount, isIncome ? styles.incomeAmount : styles.expenseAmount]}>
          {isIncome ? '+' : '-'}{formatMMK(transaction.amount)}
        </Text>
        <ChevronRight color={colors.textMuted} size={16} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.md, flexDirection: 'row', gap: spacing.sm, padding: spacing.md, ...shadows.soft },
  icon: { alignItems: 'center', borderRadius: radii.sm, height: 40, justifyContent: 'center', width: 40 },
  incomeIcon: { backgroundColor: '#E2F1E8' },
  expenseIcon: { backgroundColor: '#FCEDEA' },
  main: { flex: 1, minWidth: 0 },
  category: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 15 },
  note: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 12, marginTop: 3 },
  amountWrap: { alignItems: 'flex-end', gap: 2 },
  amount: { fontFamily: fontFamily.bold, fontSize: 13, fontVariant: ['tabular-nums'] },
  incomeAmount: { color: colors.income },
  expenseAmount: { color: colors.expense },
});
