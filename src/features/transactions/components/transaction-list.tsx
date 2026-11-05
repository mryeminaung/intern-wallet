import { StyleSheet, Text, View } from 'react-native';
import { formatDisplayDate, dateKey } from '../../../lib/date';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fontFamily } from '../../../theme/typography';
import type { Category, Transaction } from '../../../types/common';
import { TransactionListItem } from './transaction-item';

type TransactionListProps = {
  transactions: readonly Transaction[];
  categories: ReadonlyMap<string, Category>;
  onTransactionPress: (id: string) => void;
};

export function TransactionList({ transactions, categories, onTransactionPress }: TransactionListProps): React.JSX.Element {
  const groups = new Map<string, Transaction[]>();
  for (const transaction of transactions) {
    const key = dateKey(transaction.date);
    groups.set(key, [...(groups.get(key) ?? []), transaction]);
  }
  return <View style={styles.container}>{[...groups.entries()].map(([date, group]) => <View key={date} style={styles.group}><View style={styles.dateRow}><Text style={styles.date}>{formatGroupDate(date)}</Text><Text style={styles.count}>{group.length} {group.length === 1 ? 'transaction' : 'transactions'}</Text></View>{group.map((transaction) => <TransactionListItem key={transaction.id} category={categories.get(transaction.categoryId)} onPress={() => onTransactionPress(transaction.id)} transaction={transaction} />)}</View>)}</View>;
}

function formatGroupDate(date: string): string {
  const today = dateKey(new Date().toISOString());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = dateKey(yesterdayDate.toISOString());
  if (date === today) return 'Today';
  if (date === yesterday) return 'Yesterday';
  return formatDisplayDate(`${date}T12:00:00.000Z`);
}

const styles = StyleSheet.create({
  container: { marginTop: spacing.lg },
  group: { gap: spacing.sm, marginBottom: spacing.lg },
  dateRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  date: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 14 },
  count: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 11 },
});
