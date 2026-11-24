import { WalletCards } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { formatMMK } from '@/lib/currency';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';
import { fontFamily } from '@/theme/typography';

type BalanceCardProps = {
  balance: number;
};

export function BalanceCard({ balance }: BalanceCardProps): React.JSX.Element {
  return <View style={styles.card}>
    <View style={styles.icon}><WalletCards color={colors.forest} size={20} /></View><View style={styles.copy}><Text style={styles.label}>Wallet balance</Text><Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={[styles.amount, balance < 0 && styles.negative]}>{formatMMK(balance)}</Text>{balance < 0 ? <Text style={styles.caption}>Expenses exceed recorded income</Text> : null}</View>
  </View>;
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', marginTop: spacing.md, minHeight: 74, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  icon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: radii.sm, height: 38, justifyContent: 'center', marginRight: spacing.md, width: 38 },
  copy: { flex: 1, minWidth: 0 },
  label: { color: colors.textMuted, fontFamily: fontFamily.medium, fontSize: 12 },
  amount: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 20, fontVariant: ['tabular-nums'], marginTop: 2 },
  negative: { color: colors.expense },
  caption: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 11, marginTop: 3 },
});
