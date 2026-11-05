import { StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { formatMMK } from '../../../lib/currency';
import { colors } from '../../../theme/colors';
import { radii, shadows, spacing } from '../../../theme/spacing';
import { fontFamily } from '../../../theme/typography';
import type { DailySpendingRow } from '../../../database/repositories/analytics.repository';

export function SpendingTrend({ points }: { points: readonly DailySpendingRow[] }): React.JSX.Element {
  const chartData = points.slice(-14).map((point) => ({ value: point.amount, label: point.date.slice(8, 10) }));
  return <View style={styles.card}><Text style={styles.title}>Spending trend</Text>{points.length === 0 ? <Text style={styles.empty}>No daily spending in this period.</Text> : <><LineChart areaChart data={chartData} color={colors.forest} dataPointsColor={colors.forest} height={150} hideRules thickness={3} yAxisTextStyle={styles.axis} /><Text style={styles.caption}>Daily expenses · latest {Math.min(14, points.length)} active days · {formatMMK(points.reduce((sum, point) => sum + point.amount, 0))} total</Text></>}</View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radii.md, marginTop: spacing.md, padding: spacing.md, ...shadows.soft },
  title: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 16, marginBottom: spacing.md },
  axis: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 9 },
  caption: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 11, marginTop: spacing.md },
  empty: { color: colors.textMuted, fontFamily: fontFamily.regular },
});
