import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ArrowDownLeft, ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Screen } from '../../src/components/shared/Screen';
import { useReports } from '../../src/features/reports/hooks/use-reports';
import { BudgetPerformance } from '../../src/features/reports/components/budget-performance';
import { CategoryBreakdown } from '../../src/features/reports/components/category-breakdown';
import { FinancialInsights } from '../../src/features/reports/components/financial-insights';
import { IncomeSourceBreakdown } from '../../src/features/reports/components/income-source-breakdown';
import { IncomeExpenseChart } from '../../src/features/reports/components/income-expense-chart';
import { SpendingTrend } from '../../src/features/reports/components/spending-trend';
import { endOfDayIso, formatDisplayDate, monthPeriod, startOfDayIso, weekPeriod, yearPeriod, type DatePeriod } from '../../src/lib/date';
import { formatMMK } from '../../src/lib/currency';
import { colors } from '../../src/theme/colors';
import { fontFamily } from '../../src/theme/typography';
import { radii, shadows, spacing } from '../../src/theme/spacing';
import { useTransactionFilterStore } from '../../src/stores/transaction-filter.store';

type PeriodMode = 'month' | 'week' | 'year' | 'custom';
type PickerMode = 'from' | 'to' | null;

export default function ReportsScreen(): React.JSX.Element {
  const router = useRouter();
  const setTransactionType = useTransactionFilterStore((state) => state.setType);
  const setTransactionCategory = useTransactionFilterStore((state) => state.setCategoryId);
  const [mode, setMode] = useState<PeriodMode>('month');
  const [periodOffset, setPeriodOffset] = useState(0);
  const [customFrom, setCustomFrom] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [customTo, setCustomTo] = useState<Date>(new Date());
  const [picker, setPicker] = useState<PickerMode>(null);
  const period = useMemo<DatePeriod>(() => {
    if (mode === 'week') return weekPeriod(periodOffset);
    if (mode === 'year') return yearPeriod(periodOffset);
    if (mode === 'custom') return { fromDate: startOfDayIso(customFrom), toDate: endOfDayIso(customTo), label: `${formatDisplayDate(startOfDayIso(customFrom))} – ${formatDisplayDate(endOfDayIso(customTo))}` };
    return monthPeriod(periodOffset);
  }, [customFrom, customTo, mode, periodOffset]);
  const { data, loading, error, refresh } = useReports(period);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const handleDateChange = (date: Date): void => {
    const active = picker;
    setPicker(null);
    if (!active) return;
    if (active === 'from') setCustomFrom(date); else setCustomTo(date);
  };

  const changeMode = (nextMode: PeriodMode): void => {
    setMode(nextMode);
    setPeriodOffset(0);
  };

  const changePeriod = (offset: number): void => {
    if (mode === 'custom') return;
    setPeriodOffset((current) => Math.min(0, current + offset));
  };

  return <Screen><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Text style={styles.eyebrow}>MONEY STORIES</Text>
    <Text style={styles.title}>Insights</Text>
    <Text style={styles.subtitle}>Understand what changed and what to do next.</Text>

    <View style={styles.modeRow}>{([['month', 'Month'], ['week', 'Week'], ['year', 'Year'], ['custom', 'Custom']] as const).map(([value, label]) => <Pressable accessibilityRole="button" key={value} onPress={() => changeMode(value)} style={[styles.modeChip, mode === value && styles.modeSelected]}><Text style={[styles.modeText, mode === value && styles.modeTextSelected]}>{label}</Text></Pressable>)}</View>
    {mode === 'custom' ? <View style={styles.customDateRow}><DateButton label={formatDisplayDate(customFrom.toISOString())} onPress={() => setPicker('from')} /><DateButton label={formatDisplayDate(customTo.toISOString())} onPress={() => setPicker('to')} /></View> : null}
    {picker ? <DateTimePicker mode="date" onDismiss={() => setPicker(null)} onValueChange={(_event, date) => handleDateChange(date)} value={picker === 'from' ? customFrom : customTo} /> : null}
    <View style={styles.periodNavigator}><Pressable accessibilityLabel="Previous reporting period" disabled={mode === 'custom'} onPress={() => changePeriod(-1)} style={styles.periodButton}><ChevronLeft color={mode === 'custom' ? colors.border : colors.forest} size={20} /></Pressable><Text style={styles.periodLabel}>{period.label}</Text><Pressable accessibilityLabel="Next reporting period" disabled={mode === 'custom' || periodOffset >= 0} onPress={() => changePeriod(1)} style={styles.periodButton}><ChevronRight color={mode === 'custom' || periodOffset >= 0 ? colors.border : colors.forest} size={20} /></Pressable></View>

    {loading ? <Text style={styles.status}>Preparing your report…</Text> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}
    {data ? <>
      <View style={styles.summaryGrid}><Summary icon={ArrowUpRight} label="Total income" value={data.totalIncome} color={colors.income} background="#E5F4EB" /><Summary icon={ArrowDownLeft} label="Total expenses" value={data.totalExpenses} color={colors.expense} background="#FDECEC" /></View>
      <View style={[styles.netCard, data.netSavings < 0 && styles.netCardNegative]}><View><Text style={styles.netLabel}>NET SAVINGS</Text><Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={styles.netValue}>{formatMMK(data.netSavings)}</Text><Text style={styles.netCaption}>Income minus expenses</Text></View><View style={styles.rate}><Text style={styles.rateLabel}>Savings rate</Text><Text style={styles.rateValue}>{data.savingsRate === null ? '—' : `${Math.round(data.savingsRate)}%`}</Text></View></View>
      <IncomeExpenseChart months={data.monthlySpending} />
      <SpendingTrend points={data.dailySpending} />
      <CategoryBreakdown categories={data.categories} totalExpenses={data.totalExpenses} />
      <IncomeSourceBreakdown sources={data.incomeSources} onPressSource={(categoryId) => { setTransactionType('income'); setTransactionCategory(categoryId); router.push('/transactions'); }} />
      <BudgetPerformance budget={data.budget} onOpenBudget={() => router.push('/budget')} />
      <FinancialInsights insights={data.insights} />
    </> : null}
  </ScrollView></Screen>;
}

function DateButton({ label, onPress }: { label: string; onPress: () => void }): React.JSX.Element {
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.dateButton}><CalendarDays color={colors.forest} size={16} /><Text numberOfLines={1} style={styles.dateText}>{label}</Text></Pressable>;
}

function Summary({ icon: Icon, label, value, color, background }: { icon: typeof ArrowUpRight; label: string; value: number; color: string; background: string }): React.JSX.Element {
  return <View style={styles.summary}><View style={[styles.summaryIcon, { backgroundColor: background }]}><Icon color={color} size={17} strokeWidth={2.4} /></View><Text style={styles.summaryLabel}>{label}</Text><Text adjustsFontSizeToFit minimumFontScale={0.75} numberOfLines={1} style={[styles.summaryValue, { color }]}>{formatMMK(value)}</Text></View>;
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  eyebrow: { color: colors.income, fontFamily: fontFamily.semiBold, fontSize: 11, letterSpacing: 1.3, marginTop: spacing.sm },
  title: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 30, marginTop: spacing.xs },
  subtitle: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 15, marginTop: spacing.xs },
  modeRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.lg },
  modeChip: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 99, borderWidth: 1, flex: 1, paddingVertical: spacing.sm },
  modeSelected: { backgroundColor: colors.forest, borderColor: colors.forest },
  modeText: { color: colors.textMuted, fontFamily: fontFamily.medium, fontSize: 11, textAlign: 'center' },
  modeTextSelected: { color: colors.white },
  customDateRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  dateButton: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.sm, borderWidth: 1, flex: 1, flexDirection: 'row', gap: spacing.xs, padding: spacing.sm },
  dateText: { color: colors.text, flex: 1, fontFamily: fontFamily.medium, fontSize: 11 },
  periodNavigator: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.md, flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md, paddingHorizontal: spacing.sm, ...shadows.soft },
  periodButton: { alignItems: 'center', height: 42, justifyContent: 'center', width: 42 },
  periodLabel: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 13 },
  status: { color: colors.textMuted, fontFamily: fontFamily.regular, marginTop: spacing.lg },
  error: { backgroundColor: '#FDECEC', borderRadius: radii.sm, color: colors.expense, fontFamily: fontFamily.regular, marginTop: spacing.md, padding: spacing.sm },
  summaryGrid: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  summary: { backgroundColor: colors.surface, borderRadius: radii.md, flex: 1, minHeight: 106, padding: spacing.md, ...shadows.soft },
  summaryIcon: { alignItems: 'center', borderRadius: radii.sm, height: 32, justifyContent: 'center', width: 32 },
  summaryLabel: { color: colors.textMuted, fontFamily: fontFamily.medium, fontSize: 12, marginTop: spacing.sm },
  summaryValue: { fontFamily: fontFamily.bold, fontSize: 15, fontVariant: ['tabular-nums'], marginTop: spacing.xs },
  netCard: { alignItems: 'center', backgroundColor: colors.forest, borderRadius: radii.lg, flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm, padding: spacing.lg, ...shadows.soft },
  netCardNegative: { backgroundColor: colors.forestDark },
  netLabel: { color: colors.forestSoft, fontFamily: fontFamily.semiBold, fontSize: 11, letterSpacing: 1 },
  netValue: { color: colors.white, fontFamily: fontFamily.bold, fontSize: 25, fontVariant: ['tabular-nums'], marginTop: spacing.xs },
  netCaption: { color: colors.forestSoft, fontFamily: fontFamily.regular, fontSize: 12, marginTop: spacing.xs },
  rate: { alignItems: 'flex-end', marginLeft: spacing.sm },
  rateLabel: { color: colors.forestSoft, fontFamily: fontFamily.regular, fontSize: 11 },
  rateValue: { color: colors.white, fontFamily: fontFamily.bold, fontSize: 19, fontVariant: ['tabular-nums'], marginTop: spacing.xs },
});
