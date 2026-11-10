import { Search, SlidersHorizontal, X } from 'lucide-react-native';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { radii, shadows, spacing } from '../../../theme/spacing';
import { fontFamily } from '../../../theme/typography';
import type { TransactionType } from '../../../types/common';

type TransactionFilterProps = {
  search: string;
  type: TransactionType | 'all';
  onSearchChange: (value: string) => void;
  onTypeChange: (type: TransactionType | 'all') => void;
  onAdvancedPress: () => void;
  advancedActive: boolean;
};

export function TransactionFilter({ search, type, onSearchChange, onTypeChange, onAdvancedPress, advancedActive }: TransactionFilterProps): React.JSX.Element {
  return <View><View style={styles.search}><Search color={colors.textMuted} size={19} /><TextInput accessibilityLabel="Search transactions" onChangeText={onSearchChange} onSubmitEditing={Keyboard.dismiss} placeholder="Search transactions" placeholderTextColor={colors.textMuted} returnKeyType="done" style={styles.input} value={search} />{search ? <Pressable accessibilityLabel="Clear search" onPress={() => onSearchChange('')}><X color={colors.textMuted} size={18} /></Pressable> : null}</View><View style={styles.controls}><ScrollView contentContainerStyle={styles.row} horizontal showsHorizontalScrollIndicator={false}>{(['all', 'expense', 'income'] as const).map((value) => <Pressable accessibilityRole="button" key={value} onPress={() => onTypeChange(value)} style={[styles.chip, type === value && styles.selected]}><Text style={[styles.chipText, type === value && styles.selectedText]}>{value === 'all' ? 'All' : value === 'expense' ? 'Expenses' : 'Income'}</Text></Pressable>)}</ScrollView><Pressable accessibilityRole="button" onPress={onAdvancedPress} style={[styles.advanced, advancedActive && styles.advancedActive]}><SlidersHorizontal color={advancedActive ? colors.white : colors.forest} size={17} /><Text style={[styles.advancedText, advancedActive && styles.selectedText]}>Filters</Text></Pressable></View></View>;
}

const styles = StyleSheet.create({
  search: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.md, flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, ...shadows.soft },
  input: { color: colors.text, flex: 1, fontFamily: fontFamily.regular, fontSize: 15, paddingVertical: spacing.md },
  controls: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  row: { gap: spacing.sm, paddingVertical: spacing.sm },
  chip: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 99, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  selected: { backgroundColor: colors.forest, borderColor: colors.forest },
  chipText: { color: colors.textMuted, fontFamily: fontFamily.medium, fontSize: 12 },
  selectedText: { color: colors.white },
  advanced: { alignItems: 'center', borderColor: colors.border, borderRadius: 99, borderWidth: 1, flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  advancedActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  advancedText: { color: colors.forest, fontFamily: fontFamily.medium, fontSize: 12 },
});
