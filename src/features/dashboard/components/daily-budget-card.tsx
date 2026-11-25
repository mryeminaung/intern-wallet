import { AlertTriangle, ArrowRight, CheckCircle2, Target } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { formatMMK } from '@/lib/currency';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { radii, shadows, spacing } from '@/theme/spacing';
import type { DailyBudgetSummary } from '@/features/budget';
import { Decoration } from '@/components/ui/Decoration';

export function DailyBudgetCard({ data, onOpen }: { data: DailyBudgetSummary; onOpen: () => void }): React.JSX.Element {
  const [explanationOpen, setExplanationOpen] = useState(false);
  const safeToSpend = getSafeToSpend(data);
  const hasPlan = safeToSpend !== null;
  const daysLabel = data.remainingDays === null ? null : `${data.remainingDays} ${data.remainingDays === 1 ? 'day' : 'days'} left in your internship`;

  if (!hasPlan) {
    return <View style={styles.setupCard}><View style={styles.setupIcon}><Target color={colors.forest} size={22} /></View><Text style={styles.setupTitle}>Plan what is safe to spend</Text><Text style={styles.setupText}>Add an internship period or daily limit to get a useful amount for today.</Text><Pressable accessibilityRole="button" onPress={onOpen} style={({ pressed }) => [styles.setupButton, pressed && styles.pressed]}><Text style={styles.setupButtonText}>Set up my plan</Text><ArrowRight color={colors.white} size={17} /></Pressable></View>;
  }

  const usage = Math.min(100, Math.max(0, data.usagePercentage ?? 0));
  const limitReached = (data.usagePercentage ?? 0) >= 100;
  const limitApproaching = (data.usagePercentage ?? 0) >= 80;
  const statusText = limitReached ? data.isExceeded ? `${formatMMK(Math.abs(data.remainingToday ?? 0))} over today's limit` : "Today's limit reached" : limitApproaching ? `${Math.round(data.usagePercentage ?? 0)}% of today's limit used · ${formatMMK(data.remainingToday ?? 0)} left` : `${formatMMK(data.remainingToday ?? 0)} left from today's limit`;
  return <View style={styles.shadow}><LinearGradient colors={limitReached ? ['#064331', '#032A21'] : ['#08704F', '#043A2D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
    <Decoration height={126} name="dots-small" style={styles.decoration} width={126} />
    <View style={styles.header}><View style={styles.amountCopy}><Text style={styles.eyebrow}>SAFE TO SPEND TODAY</Text><Text adjustsFontSizeToFit minimumFontScale={0.68} numberOfLines={1} style={styles.safeAmount}>{formatMMK(Math.floor(safeToSpend))}</Text></View><Pressable accessibilityLabel="Adjust daily plan" accessibilityRole="button" onPress={onOpen} style={({ pressed }) => [styles.adjust, pressed && styles.pressed]}><Text style={styles.adjustText}>Adjust</Text><ArrowRight color={colors.white} size={15} /></Pressable></View>
    <Text style={styles.context}>{daysLabel ?? 'Your guide for today'}</Text>
    {data.dailyLimit !== null ? <><View accessibilityLabel="Daily spending limit used" accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(usage) }} style={styles.track}><View style={[styles.fill, limitReached && styles.fillExceeded, { width: `${usage}%` }]} /></View><View style={styles.statusRow}>{limitApproaching ? <AlertTriangle color="#FECACA" size={15} /> : <CheckCircle2 color="#A7F3D0" size={15} />}<Text style={styles.status}>{statusText}</Text></View></> : <Text style={styles.guidance}>Based on your available balance and remaining internship days.</Text>}
    <View style={styles.stats}><Stat label="Spent today" value={formatMMK(data.spentToday)} /><View style={styles.divider} /><Stat label={data.dailyLimit !== null ? 'Daily limit' : 'Average daily spend'} value={formatMMK(data.dailyLimit ?? Math.round(data.averageDailySpending ?? 0))} /></View>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: explanationOpen }} onPress={() => setExplanationOpen((value) => !value)} style={styles.explainButton}><Text style={styles.explainButtonText}>{explanationOpen ? 'Hide calculation' : 'How is this calculated?'}</Text></Pressable>
    {explanationOpen ? <Text style={styles.explanation}>{data.remainingToday === null ? 'No daily limit is set. ' : `${formatMMK(Math.max(0, data.remainingToday))} remains from your daily limit. `}{data.remainingDays === null || data.suggestedSafeDailySpending === null ? 'Add internship dates to calculate a daily amount from your balance. ' : `Your available balance spread across ${data.remainingDays} remaining days is ${formatMMK(Math.floor(data.suggestedSafeDailySpending))} per day. `}We show the smaller available amount, never below zero. Record all income and expenses to keep this guide accurate.</Text> : null}
  </LinearGradient></View>;
}

function getSafeToSpend(data: DailyBudgetSummary): number | null {
  const candidates = [data.remainingToday, data.suggestedSafeDailySpending].filter((value): value is number => value !== null);
  return candidates.length === 0 ? null : Math.max(0, Math.min(...candidates));
}

function Stat({ label, value }: { label: string; value: string }): React.JSX.Element {
  return <View style={styles.stat}><Text style={styles.statLabel}>{label}</Text><Text adjustsFontSizeToFit minimumFontScale={0.75} numberOfLines={1} style={styles.statValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  shadow: { borderRadius: radii.lg, marginTop: spacing.md, ...shadows.soft },
  card: { borderRadius: radii.lg, overflow: 'hidden', padding: spacing.screenHorizontal },
  decoration: { bottom: -38, opacity: 0.12, position: 'absolute', right: -32 },
  header: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  amountCopy: { flex: 1, minWidth: 0, paddingRight: spacing.sm },
  eyebrow: { color: '#A7F3D0', fontFamily: fontFamily.semiBold, fontSize: 11, letterSpacing: 1 },
  safeAmount: { color: colors.white, fontFamily: fontFamily.bold, fontSize: 34, fontVariant: ['tabular-nums'], marginTop: spacing.xs },
  adjust: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 99, flexDirection: 'row', gap: 3, minHeight: 48, paddingHorizontal: spacing.sm },
  adjustText: { color: colors.white, fontFamily: fontFamily.semiBold, fontSize: 11 },
  context: { color: '#D1FAE5', fontFamily: fontFamily.medium, fontSize: 12, marginTop: spacing.xs },
  track: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 99, height: 8, marginTop: spacing.lg, overflow: 'hidden' },
  fill: { backgroundColor: '#6EE7B7', borderRadius: 99, height: '100%' },
  fillExceeded: { backgroundColor: '#FCA5A5' },
  statusRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm },
  status: { color: colors.white, fontFamily: fontFamily.medium, fontSize: 11 },
  guidance: { color: '#D1FAE5', fontFamily: fontFamily.regular, fontSize: 11, lineHeight: 17, marginTop: spacing.lg },
  explainButton: { alignSelf: 'flex-start', justifyContent: 'center', minHeight: 44, marginTop: spacing.sm },
  explainButtonText: { color: '#D1FAE5', fontFamily: fontFamily.semiBold, fontSize: 12, textDecorationLine: 'underline' },
  explanation: { color: colors.white, fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 18, marginTop: spacing.xs },
  stats: { borderTopColor: 'rgba(255,255,255,0.18)', borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', marginTop: spacing.lg, paddingTop: spacing.md },
  stat: { flex: 1 },
  statLabel: { color: '#A7F3D0', fontFamily: fontFamily.medium, fontSize: 11 },
  statValue: { color: colors.white, fontFamily: fontFamily.bold, fontSize: 14, fontVariant: ['tabular-nums'], marginTop: spacing.xs },
  divider: { backgroundColor: 'rgba(255,255,255,0.18)', marginHorizontal: spacing.md, width: StyleSheet.hairlineWidth },
  setupCard: { alignItems: 'flex-start', backgroundColor: colors.surface, borderRadius: radii.lg, marginTop: spacing.md, padding: spacing.screenHorizontal, ...shadows.soft },
  setupIcon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: radii.sm, height: 44, justifyContent: 'center', width: 44 },
  setupTitle: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 20, marginTop: spacing.md },
  setupText: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 20, marginTop: spacing.xs },
  setupButton: { alignItems: 'center', backgroundColor: colors.forest, borderRadius: radii.sm, flexDirection: 'row', gap: spacing.xs, marginTop: spacing.md, minHeight: 48, paddingHorizontal: spacing.md },
  setupButtonText: { color: colors.white, fontFamily: fontFamily.semiBold, fontSize: 13 },
  pressed: { opacity: 0.72 },
});
