import { ArrowDownLeft, ArrowUpRight, BarChart3 } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { radii, spacing } from '../../../theme/spacing';
import { fontFamily } from '../../../theme/typography';

type QuickActionsProps = { onAddExpense: () => void; onAddIncome: () => void; onReports: () => void; };

export function QuickActions({ onAddExpense, onAddIncome, onReports }: QuickActionsProps): React.JSX.Element {
  const actions = [
    { label: 'Add expense', icon: ArrowDownLeft, onPress: onAddExpense, color: colors.expense },
    { label: 'Add income', icon: ArrowUpRight, onPress: onAddIncome, color: colors.income },
    { label: 'View reports', icon: BarChart3, onPress: onReports, color: colors.forest },
  ];
  return <View style={styles.row}>{actions.map(({ label, icon: Icon, onPress, color }) => <Pressable accessibilityRole="button" key={label} onPress={onPress} style={({ pressed }) => [styles.action, pressed && styles.pressed]}><View style={[styles.icon, { backgroundColor: `${color}18` }]}><Icon color={color} size={20} /></View><Text style={styles.label}>{label}</Text></Pressable>)}</View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.lg },
  action: { alignItems: 'center', gap: spacing.xs, maxWidth: 94, minWidth: 78 },
  pressed: { opacity: 0.7 },
  icon: { alignItems: 'center', borderRadius: radii.md, height: 46, justifyContent: 'center', width: 46 },
  label: { color: colors.text, fontFamily: fontFamily.medium, fontSize: 12 },
});
