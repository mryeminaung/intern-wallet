import { useCallback } from 'react';
import { AppState, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { QuickActions } from './components/quick-actions';
import { RecentTransactions } from './components/recent-transactions';
import { ProfileAvatar } from '../profile/components/profile-avatar';
import { useProfile } from '../profile/hooks/use-profile';

export function DashboardScreen(): React.JSX.Element {
  const router = useRouter();
  const { data, loading, error, refresh } = useDashboard();
  const { data: dailyBudget, loading: dailyBudgetLoading, error: dailyBudgetError, refresh: refreshDailyBudget } = useDailyBudget();
  const { profile } = useProfile();
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
  const personalizedGreeting = profile.displayName ? `${greeting}, ${profile.displayName}` : greeting;

  return <Screen><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><View style={styles.headerCopy}><View style={styles.brandRow}><Image accessibilityIgnoresInvertColors source={require('../../../assets/icon.png')} style={styles.logo} /><Text style={styles.eyebrow}>TODAY</Text></View><Text numberOfLines={2} style={styles.title}>{personalizedGreeting}</Text><Text style={styles.subtitle}>Know what is safe to spend before you spend it.</Text></View><Pressable accessibilityLabel="Open settings" accessibilityRole="button" onPress={() => router.push('/settings')} style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}><ProfileAvatar avatarUri={profile.avatarUri} displayName={profile.displayName} size={44} /></Pressable></View>
    {loading ? <Text style={styles.status}>Loading your dashboard…</Text> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}
    {data ? <>
      {dailyBudget ? <DailyBudgetCard data={dailyBudget} onOpen={() => router.push('/daily-budget')} /> : null}
      <QuickActions onAddExpense={() => router.push('/transactions/new?type=expense')} onAddIncome={() => router.push('/transactions/new?type=income')} />
      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>This month</Text><Pressable accessibilityRole="button" onPress={() => router.push('/reports')}><Text style={styles.sectionLink}>View insights</Text></Pressable></View>
      <BalanceCard balance={data.balance} />
      <FinancialSummary expenses={data.monthExpenses} income={data.monthIncome} />
      {dailyBudgetLoading ? <Text style={styles.status}>Loading daily budget…</Text> : null}
      {dailyBudgetError ? <Text style={styles.error}>{dailyBudgetError}</Text> : null}
      <RecentTransactions onAddTransaction={() => router.push('/transactions/new')} onTransactionPress={(id) => router.push(`/transactions/${id}`)} onViewAll={() => router.push('/transactions')} transactions={data.recentTransactions} />
    </> : null}
  </ScrollView></Screen>;
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl + spacing.lg },
  header: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  headerCopy: { flex: 1, paddingRight: spacing.md },
  brandRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  logo: { borderRadius: 9, height: 30, width: 30 },
  eyebrow: { color: colors.income, fontFamily: fontFamily.semiBold, fontSize: 11, letterSpacing: 1.3 },
  title: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 30, marginTop: spacing.xs },
  subtitle: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 20, marginBottom: spacing.lg, marginTop: spacing.xs },
  settingsButton: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 99, height: 44, justifyContent: 'center', width: 44 },
  pressed: { opacity: 0.72 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xl },
  sectionTitle: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 17 },
  sectionLink: { color: colors.forest, fontFamily: fontFamily.semiBold, fontSize: 12 },
  status: { color: colors.textMuted, fontFamily: fontFamily.regular, marginTop: spacing.lg },
  error: { backgroundColor: '#FCEDEA', borderRadius: 8, color: colors.expense, fontFamily: fontFamily.regular, marginTop: spacing.md, padding: spacing.sm },
});

function getGreeting(hour = new Date().getHours()): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
