import { WalletCards } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { formatMMK } from '../../../lib/currency';
import { colors } from '../../../theme/colors';
import { radii, shadows, spacing } from '../../../theme/spacing';
import { fontFamily } from '../../../theme/typography';

type BalanceCardProps = {
  balance: number;
};

export function BalanceCard({ balance }: BalanceCardProps): React.JSX.Element {
  return <View style={styles.card}>
    <View style={styles.icon}><WalletCards color={colors.forest} size={20} /></View><View style={styles.copy}><Text style={styles.label}>AVAILABLE BALANCE</Text><Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={[styles.amount, balance < 0 && styles.negative]}>{formatMMK(balance)}</Text><Text style={styles.caption}>All recorded income minus expenses</Text></View>
  </View>;
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.md, flexDirection: 'row', marginTop: spacing.sm, padding: spacing.md, ...shadows.soft },
  icon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: radii.sm, height: 42, justifyContent: 'center', marginRight: spacing.md, width: 42 },
  copy: { flex: 1, minWidth: 0 },
  label: { color: colors.textMuted, fontFamily: fontFamily.semiBold, fontSize: 10, letterSpacing: 0.7 },
  amount: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 22, fontVariant: ['tabular-nums'], marginTop: spacing.xs },
  negative: { color: colors.expense },
  caption: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 11, marginTop: 3 },
});
