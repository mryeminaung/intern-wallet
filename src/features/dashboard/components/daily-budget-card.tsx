import { AlertTriangle, ArrowRight, CheckCircle2, Target } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatMMK } from '../../../lib/currency';
import { colors } from '../../../theme/colors';
import { fontFamily } from '../../../theme/typography';
import { radii, shadows, spacing } from '../../../theme/spacing';
import type { DailyBudgetSummary } from '../../budget/services/daily-budget.service';

export function DailyBudgetCard({ data, onOpen }: { data: DailyBudgetSummary; onOpen: () => void }): React.JSX.Element {
  const safeToSpend = getSafeToSpend(data);
  const hasPlan = safeToSpend !== null;
  const daysLabel = data.remainingDays === null ? null : `${data.remainingDays} ${data.remainingDays === 1 ? 'day' : 'days'} left`;

  if (!hasPlan) {
    return <View style={styles.setupCard}><View style={styles.setupIcon}><Target color={colors.forest} size={22} /></View><Text style={styles.setupTitle}>Plan what is safe to spend</Text><Text style={styles.setupText}>Add an internship period or daily limit to get a useful amount for today.</Text><Pressable accessibilityRole="button" onPress={onOpen} style={({ pressed }) => [styles.setupButton, pressed && styles.pressed]}><Text style={styles.setupButtonText}>Set up my plan</Text><ArrowRight color={colors.white} size={17} /></Pressable></View>;
  }

  const usage = Math.min(100, Math.max(0, data.usagePercentage ?? 0));
  return <View style={[styles.card, data.isExceeded && styles.cardExceeded]}>
    <View style={styles.header}><View><Text style={styles.eyebrow}>SAFE TO SPEND TODAY</Text><Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={styles.safeAmount}>{formatMMK(Math.floor(safeToSpend))}</Text></View><Pressable accessibilityLabel="Adjust daily plan" accessibilityRole="button" onPress={onOpen} style={({ pressed }) => [styles.adjust, pressed && styles.pressed]}><Text style={styles.adjustText}>Adjust</Text><ArrowRight color={colors.white} size={15} /></Pressable></View>
    <Text style={styles.context}>{formatMMK(data.availableBalance)} available{daysLabel ? ` · ${daysLabel}` : ''}</Text>
    {data.dailyLimit !== null ? <><View style={styles.track}><View style={[styles.fill, data.isExceeded && styles.fillExceeded, { width: `${usage}%` }]} /></View><View style={styles.statusRow}>{data.isExceeded ? <AlertTriangle color="#FECACA" size={15} /> : <CheckCircle2 color="#A7F3D0" size={15} />}<Text style={styles.status}>{data.isExceeded ? `${formatMMK(Math.abs(data.remainingToday ?? 0))} over today's limit` : `${formatMMK(data.remainingToday ?? 0)} left from today's limit`}</Text></View></> : <Text style={styles.guidance}>Based on your available balance and remaining internship days.</Text>}
    <View style={styles.stats}><Stat label="Spent today" value={formatMMK(data.spentToday)} /><View style={styles.divider} /><Stat label={data.dailyLimit !== null ? 'Daily limit' : 'Average daily spend'} value={formatMMK(data.dailyLimit ?? Math.round(data.averageDailySpending ?? 0))} /></View>
  </View>;
}

function getSafeToSpend(data: DailyBudgetSummary): number | null {
  const candidates = [data.remainingToday, data.suggestedSafeDailySpending].filter((value): value is number => value !== null);
  return candidates.length === 0 ? null : Math.max(0, Math.min(...candidates));
}

function Stat({ label, value }: { label: string; value: string }): React.JSX.Element {
  return <View style={styles.stat}><Text style={styles.statLabel}>{label}</Text><Text adjustsFontSizeToFit minimumFontScale={0.75} numberOfLines={1} style={styles.statValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.forest, borderRadius: radii.lg, padding: spacing.lg, ...shadows.floating },
  cardExceeded: { backgroundColor: colors.forestDark },
  header: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  eyebrow: { color: '#A7F3D0', fontFamily: fontFamily.semiBold, fontSize: 11, letterSpacing: 1 },
  safeAmount: { color: colors.white, fontFamily: fontFamily.bold, fontSize: 34, fontVariant: ['tabular-nums'], marginTop: spacing.xs },
  adjust: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 99, flexDirection: 'row', gap: 3, paddingHorizontal: spacing.sm, paddingVertical: 7 },
  adjustText: { color: colors.white, fontFamily: fontFamily.semiBold, fontSize: 11 },
  context: { color: '#D1FAE5', fontFamily: fontFamily.medium, fontSize: 12, marginTop: spacing.xs },
  track: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 99, height: 8, marginTop: spacing.lg, overflow: 'hidden' },
  fill: { backgroundColor: '#6EE7B7', borderRadius: 99, height: '100%' },
  fillExceeded: { backgroundColor: '#FCA5A5' },
  statusRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm },
  status: { color: colors.white, fontFamily: fontFamily.medium, fontSize: 11 },
  guidance: { color: '#D1FAE5', fontFamily: fontFamily.regular, fontSize: 11, lineHeight: 17, marginTop: spacing.lg },
  stats: { borderTopColor: 'rgba(255,255,255,0.18)', borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', marginTop: spacing.lg, paddingTop: spacing.md },
  stat: { flex: 1 },
  statLabel: { color: '#A7F3D0', fontFamily: fontFamily.medium, fontSize: 10 },
  statValue: { color: colors.white, fontFamily: fontFamily.bold, fontSize: 14, fontVariant: ['tabular-nums'], marginTop: spacing.xs },
  divider: { backgroundColor: 'rgba(255,255,255,0.18)', marginHorizontal: spacing.md, width: StyleSheet.hairlineWidth },
  setupCard: { alignItems: 'flex-start', backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, ...shadows.soft },
  setupIcon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: radii.sm, height: 44, justifyContent: 'center', width: 44 },
  setupTitle: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 20, marginTop: spacing.md },
  setupText: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 20, marginTop: spacing.xs },
  setupButton: { alignItems: 'center', backgroundColor: colors.forest, borderRadius: radii.sm, flexDirection: 'row', gap: spacing.xs, marginTop: spacing.md, minHeight: 46, paddingHorizontal: spacing.md },
  setupButtonText: { color: colors.white, fontFamily: fontFamily.semiBold, fontSize: 13 },
  pressed: { opacity: 0.72 },
});
