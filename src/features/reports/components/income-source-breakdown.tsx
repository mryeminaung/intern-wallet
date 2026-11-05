import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ReportCategory } from '../services/reports.service';
import { formatMMK } from '../../../lib/currency';
import { colors } from '../../../theme/colors';
import { fontFamily } from '../../../theme/typography';
import { radii, spacing } from '../../../theme/spacing';

export function IncomeSourceBreakdown({ sources, onPressSource }: {
  sources: readonly ReportCategory[];
  onPressSource: (categoryId: string) => void;
}): React.JSX.Element {
  return <View style={styles.card}>
    <Text style={styles.title}>Income sources</Text>
    {sources.length === 0 ? <Text style={styles.empty}>No income recorded in this period.</Text> : sources.map((source) =>
      <Pressable accessibilityRole="button" key={source.categoryId} onPress={() => onPressSource(source.categoryId)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        <Text style={styles.icon}>{source.categoryIcon}</Text>
        <View style={styles.copy}><Text style={styles.name}>{source.categoryName}</Text><Text style={styles.percent}>{Math.round(source.percentage)}% of income</Text></View>
        <Text style={styles.amount}>{formatMMK(source.amount)}</Text>
      </Pressable>,
    )}
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radii.md, marginTop: spacing.md, padding: spacing.md },
  title: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 16, marginBottom: spacing.sm },
  row: { alignItems: 'center', borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 62 },
  pressed: { opacity: 0.7 },
  icon: { fontSize: 22, width: 38 },
  copy: { flex: 1, minWidth: 0 },
  name: { color: colors.text, fontFamily: fontFamily.medium, fontSize: 13 },
  percent: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 11 },
  amount: { color: colors.income, fontFamily: fontFamily.bold, fontSize: 13, fontVariant: ['tabular-nums'] },
  empty: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 13 },
});
