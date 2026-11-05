import { useMemo, useState } from 'react';
import { PieChart, type pieDataItem } from 'react-native-gifted-charts';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatMMK } from '../../../lib/currency';
import { colors } from '../../../theme/colors';
import { fontFamily } from '../../../theme/typography';
import { radii, shadows, spacing } from '../../../theme/spacing';
import type { ReportCategory } from '../services/reports.service';

const categoryColors = ['#25865A', '#7E9F8C', '#D5A45B', '#8293B8', '#B7A5C9', '#D65B5B', '#5D8D9A', '#9B7A63'];

export function CategoryBreakdown({ categories, totalExpenses }: { categories: readonly ReportCategory[]; totalExpenses: number }): React.JSX.Element {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const chartData = useMemo<pieDataItem[]>(() => categories.filter((category) => category.amount > 0).map((category, index) => ({ value: category.amount, color: categoryColors[index % categoryColors.length], focused: selectedIndex === index })), [categories, selectedIndex]);
  const selectedCategory = selectedIndex >= 0 ? categories[selectedIndex] : undefined;
  const centerCategory = selectedCategory ? selectedCategory.categoryName : 'TOTAL SPENDING';
  const centerAmount = selectedCategory ? selectedCategory.amount : totalExpenses;

  return <View style={styles.card}><View style={styles.header}><Text style={styles.title}>Spending by category</Text><Text style={styles.subtitle}>{formatMMK(totalExpenses)} · {categories.length} {categories.length === 1 ? 'category' : 'categories'}</Text></View>{categories.length === 0 || totalExpenses <= 0 ? <View style={styles.empty}><Text style={styles.emptyIcon}>◌</Text><Text style={styles.emptyTitle}>No spending data for this period</Text><Text style={styles.emptyText}>Choose another period or add an expense to see the breakdown.</Text></View> : <><View style={styles.chartWrap}><PieChart data={chartData} donut focusOnPress innerCircleColor={colors.surface} innerRadius={63} onPress={(_item: pieDataItem, index: number) => setSelectedIndex((current) => current === index ? -1 : index)} radius={101} selectedIndex={selectedIndex} strokeColor={colors.surface} strokeWidth={2} centerLabelComponent={() => <View style={styles.center}><Text numberOfLines={2} style={styles.centerLabel}>{centerCategory}</Text><Text adjustsFontSizeToFit minimumFontScale={0.75} numberOfLines={1} style={styles.centerAmount}>{formatMMK(centerAmount)}</Text>{selectedCategory ? <Text style={styles.centerPercent}>{Math.round(selectedCategory.percentage)}%</Text> : null}</View>} /></View><View style={styles.legend}>{categories.map((category, index) => <Pressable accessibilityRole="button" key={category.categoryId} onPress={() => setSelectedIndex((current) => current === index ? -1 : index)} style={({ pressed }) => [styles.legendRow, pressed && styles.pressed]}><View style={[styles.dot, { backgroundColor: categoryColors[index % categoryColors.length] }]} /><View style={styles.categoryIcon}><Text style={styles.categoryIconText}>{category.categoryIcon || '•'}</Text></View><Text numberOfLines={1} style={styles.name}>{category.categoryName || 'Uncategorized'}</Text><Text style={styles.percent}>{Math.round(category.percentage)}%</Text><Text style={styles.amount}>{formatMMK(category.amount)}</Text></Pressable>)}</View></>}</View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radii.md, marginTop: spacing.md, padding: spacing.md, ...shadows.soft },
  header: { marginBottom: spacing.md },
  title: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 16 },
  subtitle: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 12, marginTop: 3 },
  chartWrap: { alignItems: 'center', justifyContent: 'center', minHeight: 218 },
  center: { alignItems: 'center', justifyContent: 'center', maxWidth: 105 },
  centerLabel: { color: colors.textMuted, fontFamily: fontFamily.medium, fontSize: 10, textAlign: 'center', textTransform: 'uppercase' },
  centerAmount: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 13, fontVariant: ['tabular-nums'], marginTop: spacing.xs, textAlign: 'center' },
  centerPercent: { color: colors.forest, fontFamily: fontFamily.semiBold, fontSize: 12, marginTop: 2 },
  legend: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.sm },
  legendRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, minHeight: 48, paddingVertical: spacing.xs },
  pressed: { opacity: 0.72 },
  dot: { borderRadius: 99, height: 8, width: 8 },
  categoryIcon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: 7, height: 28, justifyContent: 'center', width: 28 },
  categoryIconText: { fontSize: 15 },
  name: { color: colors.text, flex: 1, fontFamily: fontFamily.medium, fontSize: 12 },
  percent: { color: colors.textMuted, fontFamily: fontFamily.semiBold, fontSize: 12, width: 34 },
  amount: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 11, fontVariant: ['tabular-nums'], textAlign: 'right' },
  empty: { alignItems: 'center', backgroundColor: colors.background, borderRadius: radii.sm, padding: spacing.lg },
  emptyIcon: { color: colors.forest, fontSize: 34 },
  emptyTitle: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 14, marginTop: spacing.sm, textAlign: 'center' },
  emptyText: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 18, marginTop: spacing.xs, textAlign: 'center' },
});
