import { StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { colors } from '../../../theme/colors';
import { radii, shadows, spacing } from '../../../theme/spacing';
import { fontFamily } from '../../../theme/typography';
import type { MonthlySpendingRow } from '../../../database/repositories/analytics.repository';

export function IncomeExpenseChart({ months }: { months: readonly MonthlySpendingRow[] }): React.JSX.Element {
  const chartData = months.flatMap((month) => [
    { value: month.income, frontColor: colors.income, label: month.month.slice(5), spacing: 2 },
    { value: month.expenses, frontColor: colors.expense },
  ]);
  return <View style={styles.card}><View style={styles.header}><Text style={styles.title}>Income vs expenses</Text><View style={styles.legend}><LegendDot color={colors.income} label="Income" /><LegendDot color={colors.expense} label="Expenses" /></View></View>{months.length === 0 ? <Text style={styles.empty}>No monthly data in this period.</Text> : <BarChart data={chartData} barBorderRadius={4} barWidth={18} height={170} initialSpacing={12} noOfSections={4} spacing={18} yAxisTextStyle={styles.axis} />}</View>;
}

function LegendDot({ color, label }: { color: string; label: string }): React.JSX.Element {
  return <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: color }]} /><Text style={styles.legendText}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radii.md, marginTop: spacing.md, padding: spacing.md, ...shadows.soft },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  title: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 16 },
  legend: { flexDirection: 'row', gap: spacing.sm },
  legendItem: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  dot: { borderRadius: 99, height: 7, width: 7 },
  legendText: { color: colors.textMuted, fontFamily: fontFamily.medium, fontSize: 10 },
  axis: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 9 },
  empty: { color: colors.textMuted, fontFamily: fontFamily.regular },
});
