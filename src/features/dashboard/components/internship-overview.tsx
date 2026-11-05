import { CalendarDays, TrendingUp } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { formatMMK } from '../../../lib/currency';
import { colors } from '../../../theme/colors';
import { fontFamily } from '../../../theme/typography';
import { radii, shadows, spacing } from '../../../theme/spacing';
import type { DailyBudgetSummary } from '../../budget/services/daily-budget.service';

export function InternshipOverview({ data }: { data: DailyBudgetSummary }): React.JSX.Element {
  const configured = data.completedDays !== null && data.remainingDays !== null;
  return <View style={styles.card}><View style={styles.header}><View style={styles.heading}><View style={styles.icon}><CalendarDays color={colors.forest} size={18} /></View><View><Text style={styles.title}>Internship overview</Text><Text style={styles.subtitle}>{configured ? `${data.internshipDurationDays} days total · ${data.completedDays} completed · ${data.remainingDays} remaining` : 'Add your internship dates for a full view'}</Text></View></View><TrendingUp color={colors.forest} size={19} /></View>{configured ? <><View style={styles.progress}><View style={[styles.progressFill, { width: `${Math.min(100, (data.completedDays ?? 0) / Math.max(1, (data.internshipDurationDays ?? 0)) * 100)}%` }]} /></View><View style={styles.stats}><Stat label="Income in internship" value={formatMMK(data.internshipIncome ?? 0)} /><Stat label="Spent in internship" value={formatMMK(data.internshipExpenses ?? 0)} /><Stat label="Internship balance" value={formatMMK(data.internshipBalance ?? 0)} /><Stat label="Avg. daily spend" value={formatMMK(Math.round(data.averageDailySpending ?? 0))} /><Stat label="Safe daily estimate" value={formatMMK(Math.round(data.suggestedSafeDailySpending ?? 0))} /></View><Text style={styles.scope}>Internship totals run from your start date through today or the end date. The safe daily estimate spreads your all-time available balance across today and future internship days.</Text></> : <Text style={styles.empty}>Available balance includes all recorded income, including personal savings. Set internship dates to see income and spending for that period.</Text>}</View>;
}

function Stat({ label, value }: { label: string; value: string }): React.JSX.Element {
  return <View style={styles.stat}><Text style={styles.label}>{label}</Text><Text adjustsFontSizeToFit minimumFontScale={0.75} numberOfLines={1} style={styles.value}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radii.md, marginTop: spacing.md, padding: spacing.md, ...shadows.soft },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  heading: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: spacing.sm },
  icon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: radii.sm, height: 36, justifyContent: 'center', width: 36 },
  title: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 16 },
  subtitle: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 12, marginTop: 3 },
  progress: { backgroundColor: colors.forestSoft, borderRadius: 99, height: 7, marginTop: spacing.md, overflow: 'hidden' },
  progressFill: { backgroundColor: colors.forest, borderRadius: 99, height: '100%' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md },
  stat: { minWidth: '44%', flex: 1 },
  label: { color: colors.textMuted, fontFamily: fontFamily.medium, fontSize: 10 },
  value: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 13, fontVariant: ['tabular-nums'], marginTop: spacing.xs },
  scope: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 11, lineHeight: 16, marginTop: spacing.md },
  empty: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 18, marginTop: spacing.md },
});
