import { Check } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors } from '../../../theme/colors';
import { radii, spacing } from '../../../theme/spacing';
import { fontFamily } from '../../../theme/typography';
import type { Category, TransactionType } from '../../../types/common';

type CategorySelectorProps = {
  categories: readonly Category[];
  type: TransactionType;
  value: string;
  onChange: (categoryId: string) => void;
};

export function CategorySelector({ categories, type, value, onChange }: CategorySelectorProps): React.JSX.Element {
  return <ScrollView contentContainerStyle={styles.row} horizontal showsHorizontalScrollIndicator={false}>{categories.filter((category) => category.type === type).map((category) => {
    const selected = category.id === value;
    return <Pressable key={category.id} onPress={() => onChange(category.id)} style={[styles.chip, selected && styles.selected]}><Text style={styles.icon}>{category.icon}</Text><Text style={[styles.text, selected && styles.selectedText]}>{category.name}</Text>{selected ? <Check color={colors.white} size={15} strokeWidth={3} /> : null}</Pressable>;
  })}</ScrollView>;
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingBottom: spacing.xs },
  chip: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  selected: { backgroundColor: colors.forest, borderColor: colors.forest },
  icon: { fontSize: 18 },
  text: { color: colors.text, fontFamily: fontFamily.medium, fontSize: 13 },
  selectedText: { color: colors.white },
});
