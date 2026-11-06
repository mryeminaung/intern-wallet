import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { CalendarDays, ChevronRight, History, Settings, Target } from 'lucide-react-native';
import { Screen } from '../../src/components/shared/Screen';
import { useDailyBudget } from '../../src/features/budget/hooks/use-daily-budget';
import { formatMMK } from '../../src/lib/currency';
import { colors } from '../../src/theme/colors';
import { fontFamily } from '../../src/theme/typography';
import { radii, shadows, spacing } from '../../src/theme/spacing';

export default function PlanScreen(): React.JSX.Element {
  const router = useRouter();
  const { data, loading, error, refresh } = useDailyBudget();
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  const suggested = data ? getDailyOutlook(data.remainingToday, data.suggestedSafeDailySpending) : null;

  return <Screen><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><View><Text style={styles.eyebrow}>YOUR MONEY PLAN</Text><Text style={styles.title}>Plan</Text></View><Pressable accessibilityLabel="Open settings" accessibilityRole="button" onPress={() => router.push('/settings')} style={({ pressed }) => [styles.settings, pressed && styles.pressed]}><Settings color={colors.forest} size={21} /></Pressable></View>
    <Text style={styles.subtitle}>Set limits now so everyday spending stays predictable.</Text>

    {loading ? <Text style={styles.status}>Loading your plan…</Text> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}
    {data ? <View style={styles.outlook}><Text style={styles.outlookLabel}>DAILY OUTLOOK</Text><Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={styles.outlookAmount}>{suggested === null ? 'Not set' : formatMMK(Math.max(0, Math.floor(suggested)))}</Text><Text style={styles.outlookText}>{data.remainingDays === null ? 'Add your internship dates to calculate a safe daily amount.' : `${formatMMK(data.availableBalance)} available · ${data.remainingDays} ${data.remainingDays === 1 ? 'day' : 'days'} left`}</Text></View> : null}

    <Text style={styles.sectionTitle}>Plan your spending</Text>
    <PlanLink icon={Target} label="Monthly budgets" description="Set overall and category limits" onPress={() => router.push('/budget')} />
    <PlanLink icon={CalendarDays} label="Daily budget & internship" description="Set your daily limit and internship dates" onPress={() => router.push('/daily-budget')} />
    <PlanLink icon={History} label="Daily spending history" description="See which days stayed within the limit" onPress={() => router.push('/daily-history')} />
  </ScrollView></Screen>;
}

function getDailyOutlook(remainingToday: number | null, suggestedSafeDailySpending: number | null): number | null {
  const candidates = [remainingToday, suggestedSafeDailySpending].filter((value): value is number => value !== null);
  return candidates.length === 0 ? null : Math.max(0, Math.min(...candidates));
}

function PlanLink({ icon: Icon, label, description, onPress }: { icon: typeof Target; label: string; description: string; onPress: () => void }): React.JSX.Element {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.link, pressed && styles.pressed]}><View style={styles.linkIcon}><Icon color={colors.forest} size={20} /></View><View style={styles.linkCopy}><Text style={styles.linkLabel}>{label}</Text><Text style={styles.linkDescription}>{description}</Text></View><ChevronRight color={colors.textMuted} size={18} /></Pressable>;
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl + spacing.lg },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  eyebrow: { color: colors.income, fontFamily: fontFamily.semiBold, fontSize: 11, letterSpacing: 1.3 },
  title: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 30, marginTop: spacing.xs },
  subtitle: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 20, marginTop: spacing.xs },
  settings: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 99, height: 44, justifyContent: 'center', width: 44 },
  outlook: { backgroundColor: colors.forest, borderRadius: radii.lg, marginTop: spacing.xl, padding: spacing.lg, ...shadows.floating },
  outlookLabel: { color: '#A7F3D0', fontFamily: fontFamily.semiBold, fontSize: 11, letterSpacing: 1 },
  outlookAmount: { color: colors.white, fontFamily: fontFamily.bold, fontSize: 30, fontVariant: ['tabular-nums'], marginTop: spacing.xs },
  outlookText: { color: '#D1FAE5', fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 18, marginTop: spacing.sm },
  sectionTitle: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 17, marginBottom: spacing.sm, marginTop: spacing.xl },
  link: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.md, flexDirection: 'row', marginBottom: spacing.sm, minHeight: 76, padding: spacing.md, ...shadows.soft },
  linkIcon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: radii.sm, height: 42, justifyContent: 'center', marginRight: spacing.md, width: 42 },
  linkCopy: { flex: 1, minWidth: 0 },
  linkLabel: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 14 },
  linkDescription: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 17, marginTop: 3 },
  status: { color: colors.textMuted, fontFamily: fontFamily.regular, marginTop: spacing.lg },
  error: { backgroundColor: '#FDECEC', borderRadius: radii.sm, color: colors.expense, fontFamily: fontFamily.regular, marginTop: spacing.md, padding: spacing.sm },
  pressed: { opacity: 0.72 },
});
