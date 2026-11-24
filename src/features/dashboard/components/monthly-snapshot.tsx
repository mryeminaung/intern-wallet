import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatMMK } from '@/lib/currency';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { radii, spacing } from '@/theme/spacing';

type MonthlySnapshotProps = {
  income: number;
  expenses: number;
  totalBudget: number;
  remainingBudget: number;
  usage: number;
  onOpenBudget: () => void;
  onOpenInsights: () => void;
};

export function MonthlySnapshot({ income, expenses, totalBudget, remainingBudget, usage, onOpenBudget, onOpenInsights }: MonthlySnapshotProps): React.JSX.Element {
  const hasBudget = totalBudget > 0;
  const overBudget = remainingBudget < 0;

  return <View style={styles.wrap}>
    <View style={styles.header}><Text style={styles.title}>This month</Text><Pressable accessibilityRole="button" onPress={onOpenInsights} style={styles.insightsButton}><Text style={styles.insightsText}>View insights</Text><ChevronRight color={colors.forest} size={16} /></Pressable></View>
    <View style={styles.card}>
      <View style={styles.figures}>
        <View style={styles.figure}><Text style={styles.label}>Spent</Text><Text adjustsFontSizeToFit minimumFontScale={0.7} numberOfLines={1} style={[styles.amount, styles.spent]}>{formatMMK(expenses)}</Text></View>
        <View style={styles.figureDivider} />
        <View style={styles.figure}><Text style={styles.label}>Income</Text><Text adjustsFontSizeToFit minimumFontScale={0.7} numberOfLines={1} style={[styles.amount, styles.income]}>{formatMMK(income)}</Text></View>
      </View>
      {hasBudget ? <>
        <View style={styles.budgetHeader}><Text style={styles.budgetLabel}>Monthly budget</Text><Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={[styles.budgetValue, overBudget && styles.overBudget]}>{overBudget ? `${formatMMK(Math.abs(remainingBudget))} over` : `${formatMMK(remainingBudget)} left`}</Text></View>
        <View accessibilityLabel="Monthly budget used" accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(Math.min(100, Math.max(0, usage))) }} style={styles.track}><View style={[styles.fill, overBudget && styles.fillExceeded, { width: `${Math.min(100, Math.max(0, usage))}%` }]} /></View>
      </> : <Pressable accessibilityRole="button" onPress={onOpenBudget} style={styles.budgetSetup}><Text style={styles.budgetSetupText}>Set a monthly budget</Text><ChevronRight color={colors.forest} size={17} /></Pressable>}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.lg },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  title: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 17 },
  insightsButton: { alignItems: 'center', flexDirection: 'row', minHeight: 48 },
  insightsText: { color: colors.forest, fontFamily: fontFamily.semiBold, fontSize: 12 },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, padding: spacing.md },
  figures: { flexDirection: 'row' },
  figure: { flex: 1, minWidth: 0 },
  figureDivider: { backgroundColor: colors.border, marginHorizontal: spacing.md, width: StyleSheet.hairlineWidth },
  label: { color: colors.textMuted, fontFamily: fontFamily.medium, fontSize: 12 },
  amount: { fontFamily: fontFamily.bold, fontSize: 18, fontVariant: ['tabular-nums'], marginTop: spacing.xs },
  spent: { color: colors.text },
  income: { color: colors.income },
  budgetHeader: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between', marginTop: spacing.lg },
  budgetLabel: { color: colors.textMuted, fontFamily: fontFamily.medium, fontSize: 12 },
  budgetValue: { color: colors.forest, flexShrink: 1, fontFamily: fontFamily.semiBold, fontSize: 12, textAlign: 'right' },
  overBudget: { color: colors.expense },
  track: { backgroundColor: colors.forestSoft, borderRadius: 99, height: 7, marginTop: spacing.sm, overflow: 'hidden' },
  fill: { backgroundColor: colors.forest, borderRadius: 99, height: '100%' },
  fillExceeded: { backgroundColor: colors.expense },
  budgetSetup: { alignItems: 'center', borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md, minHeight: 48 },
  budgetSetupText: { color: colors.forest, fontFamily: fontFamily.semiBold, fontSize: 13 },
});
