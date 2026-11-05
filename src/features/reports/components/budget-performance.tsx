import { ArrowRight, Target } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatMMK } from '../../../lib/currency';
import { colors } from '../../../theme/colors';
import { fontFamily } from '../../../theme/typography';
import { radii, shadows, spacing } from '../../../theme/spacing';
import type { ReportBudget } from '../services/reports.service';
import { BudgetProgress } from '../../budget/components/budget-progress';

const statusLabels = {
  normal: 'Within budget',
  approaching: 'Approaching limit',
  'almost-exhausted': 'Near limit',
  exceeded: 'Exceeded',
} as const;

export function BudgetPerformance({ budget, onOpenBudget }: { budget: ReportBudget | null; onOpenBudget: () => void }): React.JSX.Element {
  return <View style={styles.card}>
    <View style={styles.header}><View style={styles.heading}><View style={styles.icon}><Target color={colors.forest} size={18} /></View><View><Text style={styles.title}>Budget performance</Text><Text style={styles.subtitle}>{budget ? statusLabels[budget.status] : 'Monthly comparison'}</Text></View></View><Pressable accessibilityRole="button" accessibilityLabel="Open budgets" onPress={onOpenBudget} style={({ pressed }) => [styles.open, pressed && styles.pressed]}><ArrowRight color={colors.forest} size={18} /></Pressable></View>
    {budget ? <><View style={styles.amountRow}><View><Text style={styles.label}>Spent</Text><Text style={styles.amount}>{formatMMK(budget.actualSpending)}</Text></View><View style={styles.right}><Text style={styles.label}>Budget</Text><Text style={styles.amount}>{formatMMK(budget.totalBudget)}</Text></View></View><BudgetProgress percentage={budget.usagePercentage} status={budget.status} /><View style={styles.footer}><Text style={styles.remaining}>{budget.remaining >= 0 ? `${formatMMK(budget.remaining)} remaining` : `${formatMMK(Math.abs(budget.remaining))} over limit`}</Text><Text style={[styles.percent, budget.status === 'exceeded' && styles.exceeded]}>{Math.round(budget.usagePercentage)}%</Text></View></> : <View style={styles.empty}><Text style={styles.emptyText}>Set a monthly budget to compare planned spending with actual expenses.</Text><Pressable accessibilityRole="button" onPress={onOpenBudget}><Text style={styles.link}>Set up budget</Text></Pressable></View>}
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radii.md, marginTop: spacing.md, padding: spacing.md, ...shadows.soft },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  heading: { alignItems: 'center', flexDirection: 'row', flex: 1, gap: spacing.sm },
  icon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: radii.sm, height: 36, justifyContent: 'center', width: 36 },
  title: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 16 },
  subtitle: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 12, marginTop: 3 },
  open: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: 99, height: 34, justifyContent: 'center', width: 34 },
  pressed: { opacity: 0.72 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg },
  right: { alignItems: 'flex-end' },
  label: { color: colors.textMuted, fontFamily: fontFamily.medium, fontSize: 11 },
  amount: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 14, fontVariant: ['tabular-nums'], marginTop: spacing.xs },
  footer: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  remaining: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 12 },
  percent: { color: colors.forest, fontFamily: fontFamily.bold, fontSize: 14, fontVariant: ['tabular-nums'] },
  exceeded: { color: colors.expense },
  empty: { backgroundColor: colors.background, borderRadius: radii.sm, marginTop: spacing.md, padding: spacing.md },
  emptyText: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 18 },
  link: { color: colors.forest, fontFamily: fontFamily.semiBold, fontSize: 12, marginTop: spacing.sm },
});
