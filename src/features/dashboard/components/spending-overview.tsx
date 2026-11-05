import { ArrowRight, Target } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatMMK } from '../../../lib/currency';
import type { CategorySpendingRow } from '../../../database/repositories/analytics.repository';
import { colors } from '../../../theme/colors';
import { radii, shadows, spacing } from '../../../theme/spacing';
import { fontFamily } from '../../../theme/typography';
import type { BudgetStatus } from '../../../types/common';
import { BudgetProgress } from '../../budget/components/budget-progress';

type SpendingOverviewProps = {
  spending: number;
  totalBudget: number;
  remainingBudget: number;
  usage: number;
  dailyAverage: number;
  highestCategory: CategorySpendingRow | null;
  previousChange: number | null;
  budgetStatus: BudgetStatus;
  onOpenBudget: () => void;
};

export function SpendingOverview({ spending, totalBudget, remainingBudget, usage, dailyAverage, highestCategory, previousChange, budgetStatus, onOpenBudget }: SpendingOverviewProps): React.JSX.Element {
  const hasBudget = totalBudget > 0;
  const budgetMessage = !hasBudget
    ? 'Set a monthly limit to make your spending easier to follow.'
    : remainingBudget >= 0
      ? `${formatMMK(remainingBudget)} remaining this month`
      : `${formatMMK(Math.abs(remainingBudget))} over your monthly limit`;

  return <View style={styles.card}>
    <View style={styles.header}>
      <View style={styles.headingWrap}><View style={styles.icon}><Target color={colors.forest} size={18} /></View><View><Text style={styles.title}>Monthly budget</Text><Text style={styles.subtitle}>{hasBudget ? `${formatMMK(spending)} spent of ${formatMMK(totalBudget)}` : 'No budget set yet'}</Text></View></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Open budget settings" onPress={onOpenBudget} style={({ pressed }) => [styles.openButton, pressed && styles.pressed]}><ArrowRight color={colors.forest} size={18} /></Pressable>
    </View>
    {hasBudget ? <><View style={styles.progressHeader}><Text style={styles.progressLabel}>{budgetMessage}</Text><Text style={[styles.percent, budgetStatus === 'exceeded' && styles.percentExceeded]}>{Math.round(usage)}%</Text></View><BudgetProgress percentage={usage} status={budgetStatus} /></> : <Pressable accessibilityRole="button" onPress={onOpenBudget} style={({ pressed }) => [styles.setup, pressed && styles.pressed]}><Text style={styles.setupText}>{budgetMessage}</Text><Text style={styles.setupLink}>Set up budget</Text></Pressable>}
    <View style={styles.insights}>
      <Metric label="Daily average" value={formatMMK(Math.round(dailyAverage))} />
      <Metric label="Top category" value={highestCategory ? `${highestCategory.categoryIcon} ${highestCategory.categoryName}` : 'No spending yet'} />
      <Metric label="vs last month" value={previousChange === null ? 'No comparison' : `${previousChange >= 0 ? '+' : ''}${Math.round(previousChange)}%`} />
    </View>
  </View>;
}

function Metric({ label, value }: { label: string; value: string }): React.JSX.Element {
  return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text numberOfLines={1} style={styles.metricValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radii.md, marginTop: spacing.md, padding: spacing.md, ...shadows.soft },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  headingWrap: { alignItems: 'center', flexDirection: 'row', flex: 1, gap: spacing.sm },
  icon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: radii.sm, height: 36, justifyContent: 'center', width: 36 },
  title: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 16 },
  subtitle: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 12, marginTop: 3 },
  openButton: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: 99, height: 34, justifyContent: 'center', width: 34 },
  pressed: { opacity: 0.72 },
  progressHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg },
  progressLabel: { color: colors.textMuted, flex: 1, fontFamily: fontFamily.medium, fontSize: 12 },
  percent: { color: colors.forest, fontFamily: fontFamily.bold, fontSize: 16, fontVariant: ['tabular-nums'] },
  percentExceeded: { color: colors.expense },
  setup: { backgroundColor: colors.background, borderRadius: radii.sm, marginTop: spacing.lg, padding: spacing.md },
  setupText: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 18 },
  setupLink: { color: colors.forest, fontFamily: fontFamily.semiBold, fontSize: 12, marginTop: spacing.sm },
  insights: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, paddingTop: spacing.md },
  metric: { flex: 1, minWidth: 0 },
  metricLabel: { color: colors.textMuted, fontFamily: fontFamily.medium, fontSize: 10 },
  metricValue: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 12, marginTop: spacing.xs },
});
