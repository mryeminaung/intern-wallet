import { ArrowLeftRight, ChevronRight, WalletCards } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WalletMascot } from '@/components/ui/WalletMascot';
import type { SourceBalanceRow } from '@/database/repositories/analytics.repository';
import { sourceLabel } from '@/lib/money-source';
import { formatMMK } from '@/lib/currency';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';
import { fontFamily } from '@/theme/typography';

type BalanceCardProps = {
  balance: number;
  sources: readonly SourceBalanceRow[];
  onOpenSource: (key: string) => void;
  onTransfer: () => void;
};

export function BalanceCard({ balance, sources, onOpenSource, onTransfer }: BalanceCardProps): React.JSX.Element {
  const visible = [{ key: 'cash', balance: 0 }, ...sources.filter((row) => row.key !== 'cash')].map((row) => sources.find((item) => item.key === row.key) ?? row).filter((row) => row.key !== 'unspecified' || row.balance !== 0);
  return <View style={styles.card}>
    <View style={styles.top}><View style={styles.icon}><WalletCards color={colors.forest} size={20} /></View><View style={styles.copy}><Text style={styles.label}>Wallet balance</Text><Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={[styles.amount, balance < 0 && styles.negative]}>{formatMMK(balance)}</Text></View></View>
    {balance < 0 ? <View style={styles.balanceWarning}><WalletMascot mood="empty" size={58} /><Text style={styles.balanceWarningText}>Expenses exceed recorded income. Check for a missing deposit or opening balance.</Text></View> : null}
    <Text style={styles.section}>BY MONEY SOURCE</Text>
    {visible.map((row) => <Pressable accessibilityRole="button" accessibilityLabel={`${sourceLabel(row.key)}, ${formatMMK(row.balance)}. View activity`} key={row.key} onPress={() => onOpenSource(row.key)} style={styles.source}><Text style={styles.sourceName}>{sourceLabel(row.key)}</Text><Text style={[styles.sourceAmount, row.balance < 0 && styles.negative]}>{formatMMK(row.balance)}</Text><ChevronRight color={colors.textMuted} size={16} /></Pressable>)}
    {visible.some((row) => row.key === 'unspecified') ? <Text style={styles.caption}>Unspecified includes older entries and any opening balance without a source. Use Transfer to assign it.</Text> : null}
    <Pressable accessibilityRole="button" onPress={onTransfer} style={styles.transfer}><ArrowLeftRight color={colors.forest} size={16} /><Text style={styles.transferText}>Transfer money</Text></Pressable>
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, marginTop: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  top: { alignItems: 'center', flexDirection: 'row', minHeight: 56 },
  icon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: radii.sm, height: 38, justifyContent: 'center', marginRight: spacing.md, width: 38 },
  copy: { flex: 1, minWidth: 0 },
  label: { color: colors.textMuted, fontFamily: fontFamily.medium, fontSize: 12 },
  amount: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 20, fontVariant: ['tabular-nums'], marginTop: 2 },
  negative: { color: colors.expense },
  balanceWarning: { alignItems: 'center', backgroundColor: '#FFF3EC', borderRadius: radii.sm, flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, padding: spacing.xs },
  balanceWarningText: { color: colors.expense, flex: 1, fontFamily: fontFamily.medium, fontSize: 11, lineHeight: 16 },
  caption: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 11, marginTop: 3 },
  section: { color: colors.textMuted, fontFamily: fontFamily.semiBold, fontSize: 10, letterSpacing: 1, marginTop: spacing.md },
  source: { alignItems: 'center', borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 48, gap: spacing.xs },
  sourceName: { color: colors.text, flex: 1, fontFamily: fontFamily.medium, fontSize: 13 },
  sourceAmount: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 13, fontVariant: ['tabular-nums'] },
  transfer: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: spacing.xs, minHeight: 44, marginTop: spacing.xs },
  transferText: { color: colors.forest, fontFamily: fontFamily.semiBold, fontSize: 13 },
});
