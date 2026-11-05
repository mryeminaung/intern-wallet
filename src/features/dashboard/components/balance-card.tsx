import { ArrowDown, ArrowUp, CircleCheck } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatMMK } from '../../../lib/currency';
import { colors } from '../../../theme/colors';
import { radii, shadows, spacing } from '../../../theme/spacing';
import { fontFamily } from '../../../theme/typography';

type BalanceCardProps = {
  balance: number;
  monthlyStipendRemaining: number;
  daysUntilPayday: number;
  onIncome: () => void;
  onExpense: () => void;
};

export function BalanceCard({ balance, monthlyStipendRemaining, daysUntilPayday, onIncome, onExpense }: BalanceCardProps): React.JSX.Element {
  return <View style={styles.card}>
    <View style={styles.header}>
      <Text style={styles.label}>TOTAL BALANCE</Text>
      <View style={styles.sync}><CircleCheck color="#6EE7B7" fill="#6EE7B7" size={11} /><Text style={styles.syncText}>Live Sync</Text></View>
    </View>
    <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={styles.amount}>{formatBalance(balance)}</Text>
    <View style={styles.divider} />
    <View style={styles.stipendRow}>
      <View><Text style={styles.stipendLabel}>Monthly Stipend Remaining</Text><Text style={styles.stipendAmount}>{formatBalance(monthlyStipendRemaining)}</Text></View>
      <View style={styles.payday}><Text style={styles.days}>{daysUntilPayday} days</Text><Text style={styles.until}>until payday</Text></View>
    </View>
    <View style={styles.actions}>
      <ActionButton icon={ArrowDown} label="Income" onPress={onIncome} variant="light" />
      <ActionButton icon={ArrowUp} label="Expense" onPress={onExpense} variant="bright" />
    </View>
  </View>;
}

function ActionButton({ icon: Icon, label, onPress, variant }: { icon: typeof ArrowDown; label: string; onPress: () => void; variant: 'light' | 'bright' }): React.JSX.Element {
  return <Pressable accessibilityRole="button" accessibilityLabel={`Add ${label.toLowerCase()}`} onPress={onPress} style={({ pressed }) => [styles.action, styles[variant], pressed && styles.pressed]}><Icon color={colors.forest} size={22} strokeWidth={2} /><Text style={styles.actionText}>{label}</Text></Pressable>;
}

function formatBalance(amount: number): string {
  const formatted = formatMMK(amount);
  return formatted.startsWith('MMK ') ? `${formatted.slice(4)} Ks` : formatted;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.income, borderRadius: 16, padding: spacing.lg, ...shadows.soft },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: '#A7F3D0', fontFamily: fontFamily.semiBold, fontSize: 14, letterSpacing: 0.4 },
  sync: { alignItems: 'center', backgroundColor: 'rgba(167, 243, 208, 0.22)', borderRadius: 99, flexDirection: 'row', gap: 5, paddingHorizontal: 11, paddingVertical: 7 },
  syncText: { color: colors.white, fontFamily: fontFamily.semiBold, fontSize: 12 },
  amount: { color: colors.white, fontFamily: fontFamily.bold, fontSize: 36, fontVariant: ['tabular-nums'], marginTop: spacing.sm },
  divider: { backgroundColor: 'rgba(167, 243, 208, 0.35)', height: StyleSheet.hairlineWidth, marginTop: spacing.md },
  stipendRow: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  stipendLabel: { color: '#A7F3D0', fontFamily: fontFamily.medium, fontSize: 14 },
  stipendAmount: { color: colors.white, fontFamily: fontFamily.bold, fontSize: 17, fontVariant: ['tabular-nums'], marginTop: spacing.xs },
  payday: { alignItems: 'flex-end' },
  days: { backgroundColor: 'rgba(167, 243, 208, 0.28)', borderRadius: 99, color: '#D1FAE5', fontFamily: fontFamily.semiBold, fontSize: 12, paddingHorizontal: 10, paddingVertical: 5 },
  until: { color: '#A7F3D0', fontFamily: fontFamily.regular, fontSize: 12, marginTop: 5 },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  action: { alignItems: 'center', borderRadius: 28, flex: 1, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', minHeight: 52 },
  light: { backgroundColor: colors.white },
  bright: { backgroundColor: '#6EE7B7' },
  actionText: { color: colors.forest, fontFamily: fontFamily.medium, fontSize: 16 },
  pressed: { opacity: 0.78 },
});
