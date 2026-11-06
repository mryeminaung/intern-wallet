import { Check } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { radii, spacing } from '../../../theme/spacing';
import { fontFamily } from '../../../theme/typography';
import type { Category, TransactionType } from '../../../types/common';

type CategorySelectorProps = {
  categories: readonly Category[];
  type: TransactionType;
  value: string;
  recentCategoryIds?: readonly string[];
  onChange: (categoryId: string) => void;
};

export function CategorySelector({ categories, type, value, recentCategoryIds = [], onChange }: CategorySelectorProps): React.JSX.Element {
  const available = categories.filter((category) => category.type === type);
  const byId = new Map(available.map((category) => [category.id, category]));
  const recent = recentCategoryIds.map((id) => byId.get(id)).filter((category): category is Category => category !== undefined);
  const recentSet = new Set(recent.map((category) => category.id));
  const remaining = available.filter((category) => !recentSet.has(category.id));
  return <View>{recent.length > 0 ? <><Text style={styles.groupLabel}>Recent</Text><CategoryRow categories={recent} onChange={onChange} value={value} /></> : null}{remaining.length > 0 ? <><Text style={[styles.groupLabel, recent.length === 0 && styles.firstLabel]}>{recent.length > 0 ? 'More categories' : 'All categories'}</Text><CategoryRow categories={remaining} onChange={onChange} value={value} /></> : null}</View>;
}

function CategoryRow({ categories, value, onChange }: { categories: readonly Category[]; value: string; onChange: (categoryId: string) => void }): React.JSX.Element {
  return <ScrollView contentContainerStyle={styles.row} horizontal showsHorizontalScrollIndicator={false}>{categories.map((category) => {
    const selected = category.id === value;
    return <Pressable accessibilityRole="button" key={category.id} onPress={() => onChange(category.id)} style={[styles.chip, selected && styles.selected]}><Text style={styles.icon}>{category.icon}</Text><Text style={[styles.text, selected && styles.selectedText]}>{category.name}</Text>{selected ? <Check color={colors.white} size={15} strokeWidth={3} /> : null}</Pressable>;
  })}</ScrollView>;
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingBottom: spacing.xs },
  groupLabel: { color: colors.textMuted, fontFamily: fontFamily.medium, fontSize: 11, marginBottom: spacing.xs, marginTop: spacing.sm },
  firstLabel: { marginTop: 0 },
  chip: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  selected: { backgroundColor: colors.forest, borderColor: colors.forest },
  icon: { fontSize: 18 },
  text: { color: colors.text, fontFamily: fontFamily.medium, fontSize: 13 },
  selectedText: { color: colors.white },
});
