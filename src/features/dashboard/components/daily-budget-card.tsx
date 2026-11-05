import { ArrowRight, AlertTriangle, CheckCircle2, Target } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatMMK } from '../../../lib/currency';
import { colors } from '../../../theme/colors';
import { fontFamily } from '../../../theme/typography';
import { radii, shadows, spacing } from '../../../theme/spacing';
import type { DailyBudgetSummary } from '../../budget/services/daily-budget.service';

export function DailyBudgetCard({ data, onOpen }: { data: DailyBudgetSummary; onOpen: () => void }): React.JSX.Element {
  const configured = data.dailyLimit !== null;
  const exceeded = data.isExceeded;
  return <View style={styles.card}>
    <View style={styles.header}><View style={styles.heading}><View style={styles.icon}><Target color={colors.forest} size={19} /></View><View><Text style={styles.title}>Today’s budget</Text><Text style={styles.subtitle}>{configured ? 'Daily spending limit' : 'Set a limit for today'}</Text></View></View><Pressable accessibilityRole="button" accessibilityLabel="Edit daily budget" onPress={onOpen} style={({ pressed }) => [styles.open, pressed && styles.pressed]}><ArrowRight color={colors.forest} size={18} /></Pressable></View>
    {configured ? <><View style={styles.amountRow}><View><Text style={styles.label}>Spent today</Text><Text style={styles.amount}>{formatMMK(data.spentToday)}</Text></View><View style={styles.right}><Text style={styles.label}>Daily limit</Text><Text style={styles.amount}>{formatMMK(data.dailyLimit ?? 0)}</Text></View></View><View style={styles.track}><View style={[styles.fill, exceeded ? styles.fillExceeded : null, { width: `${Math.min(100, Math.max(0, data.usagePercentage ?? 0))}%` }]} /></View><View style={styles.footer}><View style={styles.statusRow}>{exceeded ? <AlertTriangle color={colors.expense} size={15} /> : <CheckCircle2 color={colors.income} size={15} />}<Text style={[styles.status, exceeded && styles.statusExceeded]}>{exceeded ? `${formatMMK(Math.abs(data.remainingToday ?? 0))} over limit` : `${formatMMK(data.remainingToday ?? 0)} remaining`}</Text></View><Text style={[styles.percent, exceeded && styles.statusExceeded]}>{Math.round(data.usagePercentage ?? 0)}%</Text></View></> : <Pressable accessibilityRole="button" onPress={onOpen} style={({ pressed }) => [styles.setup, pressed && styles.pressed]}><Text style={styles.setupText}>Choose a daily limit to keep everyday spending predictable. Your limit resets each local calendar day.</Text><Text style={styles.setupLink}>Set daily budget</Text></Pressable>}
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radii.lg, marginTop: spacing.md, padding: spacing.lg, ...shadows.soft },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  heading: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: spacing.sm },
  icon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: radii.sm, height: 38, justifyContent: 'center', width: 38 },
  title: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 17 },
  subtitle: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 12, marginTop: 3 },
  open: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: 99, height: 36, justifyContent: 'center', width: 36 },
  pressed: { opacity: 0.72 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg },
  right: { alignItems: 'flex-end' },
  label: { color: colors.textMuted, fontFamily: fontFamily.medium, fontSize: 11 },
  amount: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 16, fontVariant: ['tabular-nums'], marginTop: spacing.xs },
  track: { backgroundColor: colors.forestSoft, borderRadius: 99, height: 9, marginTop: spacing.md, overflow: 'hidden' },
  fill: { backgroundColor: colors.income, borderRadius: 99, height: '100%' },
  fillExceeded: { backgroundColor: colors.expense },
  footer: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  statusRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  status: { color: colors.income, fontFamily: fontFamily.medium, fontSize: 12 },
  statusExceeded: { color: colors.expense },
  percent: { color: colors.forest, fontFamily: fontFamily.bold, fontSize: 14, fontVariant: ['tabular-nums'] },
  setup: { backgroundColor: colors.background, borderRadius: radii.sm, marginTop: spacing.md, padding: spacing.md },
  setupText: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 18 },
  setupLink: { color: colors.forest, fontFamily: fontFamily.semiBold, fontSize: 12, marginTop: spacing.sm },
});
