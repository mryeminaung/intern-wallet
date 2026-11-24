import { StyleSheet, Text, View } from 'react-native';
import type { MoneyFlowRow } from '@/database/repositories/analytics.repository';
import { formatMMK } from '@/lib/currency';
import { moneySourceLabel } from '@/lib/money-source';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { radii, spacing } from '@/theme/spacing';

export function MoneyFlowBreakdown({ rows }: { rows: readonly MoneyFlowRow[] }): React.JSX.Element {
  return <View style={styles.card}>
    <Text style={styles.title}>Cash & bank flow</Text>
    <Text style={styles.subtitle}>Where income arrived and expenses were paid</Text>
    {rows.length === 0 ? <Text style={styles.empty}>No transactions in this period.</Text> : rows.map((row) => {
      const key = `${row.sourceType ?? 'unspecified'}:${row.bankName ?? ''}`;
      return <View key={key} style={styles.row}>
        <Text style={styles.name}>{moneySourceLabel(row.sourceType, row.bankName)}</Text>
        <View style={styles.amounts}><Text style={styles.income}>In {formatMMK(row.income)}</Text><Text style={styles.expenses}>Out {formatMMK(row.expenses)}</Text></View>
      </View>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radii.md, marginTop: spacing.md, padding: spacing.md },
  title: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 16 },
  subtitle: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 12, marginTop: spacing.xs, marginBottom: spacing.sm },
  empty: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 13, marginTop: spacing.sm },
  row: { alignItems: 'center', borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 58, justifyContent: 'space-between' },
  name: { color: colors.text, flex: 1, fontFamily: fontFamily.medium, fontSize: 14 },
  amounts: { alignItems: 'flex-end' },
  income: { color: colors.income, fontFamily: fontFamily.semiBold, fontSize: 12 },
  expenses: { color: colors.expense, fontFamily: fontFamily.semiBold, fontSize: 12, marginTop: 2 },
});
