import { useCallback } from 'react';
import { AppState, ScrollView, StyleSheet, Text } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '../../components/shared/Screen';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fontFamily } from '../../theme/typography';
import { millisecondsUntilNextLocalDay } from '../../lib/date';
import { useDashboard } from './hooks/use-dashboard';
import { useDailyBudget } from '../budget/hooks/use-daily-budget';
import { BalanceCard } from './components/balance-card';
import { DailyBudgetCard } from './components/daily-budget-card';
import { FinancialSummary } from './components/financial-summary';
import { InternshipOverview } from './components/internship-overview';
import { QuickActions } from './components/quick-actions';
import { RecentTransactions } from './components/recent-transactions';

export function DashboardScreen(): React.JSX.Element {
  const router = useRouter();
  const { data, loading, error, refresh } = useDashboard();
  const { data: dailyBudget, loading: dailyBudgetLoading, error: dailyBudgetError, refresh: refreshDailyBudget } = useDailyBudget();
  useFocusEffect(useCallback(() => {
    const refreshAll = (): void => { void Promise.all([refresh(), refreshDailyBudget()]); };
    let dayTimer: ReturnType<typeof setTimeout>;
    const scheduleNextDay = (): void => {
      clearTimeout(dayTimer);
      dayTimer = setTimeout(() => {
        refreshAll();
        scheduleNextDay();
      }, millisecondsUntilNextLocalDay() + 1000);
    };
    refreshAll();
    scheduleNextDay();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshAll();
        scheduleNextDay();
      }
    });
    return () => {
      clearTimeout(dayTimer);
      subscription.remove();
    };
  }, [refresh, refreshDailyBudget]));
  const greeting = getGreeting();

  return <Screen><ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.eyebrow}>INTERN WALLET</Text>
    <Text style={styles.title}>{greeting}</Text>
    <Text style={styles.subtitle}>Your internship finances, at a glance.</Text>
    {loading ? <Text style={styles.status}>Loading your dashboard…</Text> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}
    {data ? <>
      <BalanceCard
        balance={data.balance}
        daysUntilPayday={getDaysUntilPayday()}
        monthlyStipendRemaining={Math.max(0, data.monthIncome - data.monthExpenses)}
        onExpense={() => router.push('/transactions/new?type=expense')}
        onIncome={() => router.push('/transactions/new?type=income')}
      />
      {dailyBudget ? <DailyBudgetCard data={dailyBudget} onOpen={() => router.push('/daily-budget')} /> : null}
      {dailyBudget ? <InternshipOverview data={dailyBudget} /> : null}
      <FinancialSummary expenses={data.monthExpenses} income={data.monthIncome} />
      {dailyBudgetLoading ? <Text style={styles.status}>Loading daily budget…</Text> : null}
      {dailyBudgetError ? <Text style={styles.error}>{dailyBudgetError}</Text> : null}
      <RecentTransactions onAddTransaction={() => router.push('/transactions/new')} onTransactionPress={(id) => router.push(`/transactions/${id}`)} onViewAll={() => router.push('/transactions')} transactions={data.recentTransactions} />
      <QuickActions onAddExpense={() => router.push('/transactions/new?type=expense')} onAddIncome={() => router.push('/transactions/new?type=income')} onReports={() => router.push('/reports')} />
    </> : null}
  </ScrollView></Screen>;
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  eyebrow: { color: colors.income, fontFamily: fontFamily.semiBold, fontSize: 11, letterSpacing: 1.3, marginTop: spacing.sm },
  title: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 30, marginTop: spacing.xs },
  subtitle: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 15, marginBottom: spacing.lg, marginTop: spacing.xs },
  status: { color: colors.textMuted, fontFamily: fontFamily.regular, marginTop: spacing.lg },
  error: { backgroundColor: '#FCEDEA', borderRadius: 8, color: colors.expense, fontFamily: fontFamily.regular, marginTop: spacing.md, padding: spacing.sm },
});

function getGreeting(hour = new Date().getHours()): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getDaysUntilPayday(referenceDate = new Date(), paydayDay = 22): number {
  const payday = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), paydayDay);
  if (payday.getTime() <= referenceDate.getTime()) {
    payday.setMonth(payday.getMonth() + 1);
  }
  return Math.max(0, Math.ceil((payday.getTime() - referenceDate.getTime()) / 86_400_000));
}
