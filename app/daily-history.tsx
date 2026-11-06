import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Screen } from '../src/components/shared/Screen';
import { useDailyHistory } from '../src/features/budget/hooks/use-daily-history';
import { formatMMK } from '../src/lib/currency';
import { formatDisplayDate, formatMonth } from '../src/lib/date';
import { colors } from '../src/theme/colors';
import { fontFamily } from '../src/theme/typography';
import { radii, spacing } from '../src/theme/spacing';
import type { DailyHistoryDay } from '../src/features/budget/services/daily-budget.service';

export default function DailyHistoryScreen(): React.JSX.Element {
  const router = useRouter();
  const [offset, setOffset] = useState(0);
  const monthDate = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth() + offset, 1), [offset]);
  const { data, loading, error, refresh } = useDailyHistory(monthDate);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  return <Screen><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><Pressable accessibilityLabel="Go back" accessibilityRole="button" onPress={() => router.back()} style={styles.nav}><ArrowLeft color={colors.text} size={22} /></Pressable><Text style={styles.title}>Daily history</Text></View>
    <Text style={styles.subtitle}>Each day has its own limit. Unused amounts do not roll over.</Text>
    <View style={styles.monthRow}><Pressable accessibilityLabel="Previous month" onPress={() => setOffset((value) => value - 1)} style={styles.nav}><ChevronLeft color={colors.forest} size={20} /></Pressable><Text style={styles.month}>{data?.periodLabel ?? formatMonth(monthDate)}</Text><Pressable accessibilityLabel="Next month" disabled={offset >= 0} onPress={() => setOffset((value) => Math.min(0, value + 1))} style={styles.nav}><ChevronRight color={offset >= 0 ? colors.border : colors.forest} size={20} /></Pressable></View>
    {loading ? <ActivityIndicator color={colors.forest} style={styles.status} /> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}
    {data && !loading ? <>
      <View style={styles.summary}><Text style={styles.label}>Spent this month</Text><Text style={styles.total}>{formatMMK(data.totalSpent)}</Text><Text style={styles.detail}>{data.overBudgetDays} days over your daily limit</Text></View>
      {data.days.length === 0 ? <Text style={styles.empty}>No days to show for this month yet.</Text> : data.days.map((day) => <DayRow day={day} key={day.date} />)}
    </> : null}
  </ScrollView></Screen>;
}

function DayRow({ day }: { day: DailyHistoryDay }): React.JSX.Element {
  return <View style={styles.dayCard}>
    <View style={styles.dayTop}><Text style={styles.dayDate}>{formatDisplayDate(`${day.date}T12:00:00`)}</Text><Text style={[styles.dayAmount, day.isExceeded && styles.exceeded]}>{formatMMK(day.spent)}</Text></View>
    <View style={styles.track}><View style={[styles.fill, day.isExceeded && styles.fillExceeded, { width: `${Math.min(100, day.usagePercentage ?? 0)}%` }]} /></View>
    <View style={styles.dayBottom}><Text style={[styles.detail, day.isExceeded && styles.exceeded]}>{day.limit === null ? 'Set a daily limit to compare spending' : day.isExceeded ? `${formatMMK(Math.abs(day.remaining ?? 0))} over limit` : `${formatMMK(day.remaining ?? 0)} left of ${formatMMK(day.limit)}`}</Text><Text style={styles.detail}>{day.changeFromPreviousDay === null ? 'First day' : `${day.changeFromPreviousDay >= 0 ? '+' : '−'}${formatMMK(Math.abs(day.changeFromPreviousDay))} vs yesterday`}</Text></View>
  </View>;
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { alignItems: 'center', flexDirection: 'row' },
  nav: { alignItems: 'center', height: 42, justifyContent: 'center', width: 42 },
  title: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 23, marginLeft: spacing.sm },
  subtitle: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 19, marginTop: spacing.sm },
  monthRow: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.md, flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg },
  month: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 15 },
  status: { marginTop: spacing.xl },
  error: { color: colors.expense, fontFamily: fontFamily.medium, marginTop: spacing.md },
  summary: { backgroundColor: colors.forest, borderRadius: radii.lg, marginTop: spacing.lg, padding: spacing.lg },
  label: { color: colors.forestSoft, fontFamily: fontFamily.medium, fontSize: 12 },
  total: { color: colors.white, fontFamily: fontFamily.bold, fontSize: 25, fontVariant: ['tabular-nums'], marginTop: spacing.xs },
  detail: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 11 },
  empty: { color: colors.textMuted, fontFamily: fontFamily.regular, marginTop: spacing.xl },
  dayCard: { backgroundColor: colors.surface, borderRadius: radii.md, marginTop: spacing.sm, padding: spacing.md },
  dayTop: { flexDirection: 'row', justifyContent: 'space-between' },
  dayDate: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 13 },
  dayAmount: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 13, fontVariant: ['tabular-nums'] },
  track: { backgroundColor: colors.forestSoft, borderRadius: 99, height: 7, marginVertical: spacing.sm, overflow: 'hidden' },
  fill: { backgroundColor: colors.income, height: '100%' },
  fillExceeded: { backgroundColor: colors.expense },
  dayBottom: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  exceeded: { color: colors.expense },
});
