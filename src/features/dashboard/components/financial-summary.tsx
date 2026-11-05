import { ArrowDownLeft, ArrowUpRight, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { formatMMK } from '../../../lib/currency';
import { colors } from '../../../theme/colors';
import { radii, shadows, spacing } from '../../../theme/spacing';
import { fontFamily } from '../../../theme/typography';

type FinancialSummaryProps = { income: number; expenses: number; };

export function FinancialSummary({ income, expenses }: FinancialSummaryProps): React.JSX.Element {
  return <View style={styles.row}><SummaryItem icon={ArrowUpRight} label="Income this month" value={income} color={colors.income} iconBackground="#E5F4EB" /><SummaryItem icon={ArrowDownLeft} label="Expenses this month" value={expenses} color={colors.expense} iconBackground="#FDECEC" /></View>;
}

function SummaryItem({ icon: Icon, label, value, color, iconBackground }: { icon: LucideIcon; label: string; value: number; color: string; iconBackground: string }): React.JSX.Element {
  return <View style={styles.card}><View style={styles.cardHeader}><View style={[styles.icon, { backgroundColor: iconBackground }]}><Icon color={color} size={17} strokeWidth={2.4} /></View><Text style={styles.label}>{label}</Text></View><Text adjustsFontSizeToFit minimumFontScale={0.75} numberOfLines={1} style={[styles.value, { color }]}>{formatMMK(value)}</Text></View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: radii.md, flex: 1, minHeight: 104, padding: spacing.md, ...shadows.soft },
  cardHeader: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  icon: { alignItems: 'center', borderRadius: radii.sm, height: 32, justifyContent: 'center', width: 32 },
  label: { color: colors.textMuted, flex: 1, fontFamily: fontFamily.medium, fontSize: 11, lineHeight: 15 },
  value: { fontFamily: fontFamily.bold, fontSize: 15, fontVariant: ['tabular-nums'], marginTop: spacing.md },
});
