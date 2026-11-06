import { ArrowDownLeft, ArrowUpRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { radii, spacing } from '../../../theme/spacing';
import { fontFamily } from '../../../theme/typography';

type QuickActionsProps = { onAddExpense: () => void; onAddIncome: () => void; };

export function QuickActions({ onAddExpense, onAddIncome }: QuickActionsProps): React.JSX.Element {
  const actions = [
    { label: 'Add expense', hint: 'Money out', icon: ArrowDownLeft, onPress: onAddExpense, color: colors.expense, background: '#FDECEC' },
    { label: 'Add income', hint: 'Money in', icon: ArrowUpRight, onPress: onAddIncome, color: colors.income, background: '#E5F4EB' },
  ];
  return <View style={styles.row}>{actions.map(({ label, hint, icon: Icon, onPress, color, background }) => <Pressable accessibilityRole="button" key={label} onPress={onPress} style={({ pressed }) => [styles.action, pressed && styles.pressed]}><View style={[styles.icon, { backgroundColor: background }]}><Icon color={color} size={20} /></View><View><Text style={styles.label}>{label}</Text><Text style={styles.hint}>{hint}</Text></View></Pressable>)}</View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  action: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, flex: 1, flexDirection: 'row', gap: spacing.sm, minHeight: 62, padding: spacing.sm },
  pressed: { opacity: 0.7 },
  icon: { alignItems: 'center', borderRadius: radii.sm, height: 40, justifyContent: 'center', width: 40 },
  label: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 12 },
  hint: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 10, marginTop: 2 },
});
