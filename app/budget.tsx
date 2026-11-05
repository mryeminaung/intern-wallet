import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowLeft, ChevronLeft, ChevronRight, Plus } from 'lucide-react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Screen } from '../src/components/shared/Screen';
import { BudgetForm } from '../src/features/budget/components/budget-form';
import { BudgetCard } from '../src/features/budget/components/budget-card';
import { CategoryBudgetItem } from '../src/features/budget/components/category-budget-item';
import { useBudgets } from '../src/features/budget/hooks/use-budgets';
import { BudgetService } from '../src/features/budget/services/budget.service';
import { budgetFormSchema, formValuesToBudgetInput, type BudgetFormValues } from '../src/features/budget/schemas/budget.schema';
import { SqliteAnalyticsRepository } from '../src/database/repositories/analytics.repository';
import { SqliteBudgetRepository } from '../src/database/repositories/budget.repository';
import { SqliteCategoryRepository } from '../src/database/repositories/category.repository';
import { formatMMK } from '../src/lib/currency';
import { formatMonth, periodForMonth } from '../src/lib/date';
import { colors } from '../src/theme/colors';
import { radii, shadows, spacing } from '../src/theme/spacing';
import { fontFamily } from '../src/theme/typography';
import { useTransactionCategories } from '../src/features/transactions/hooks/use-transaction-categories';
import type { BudgetProgress } from '../src/types/common';

export default function BudgetScreen(): React.JSX.Element {
  const router = useRouter();
  const database = useSQLiteContext();
  const [month, setMonth] = useState(formatMonth());
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetProgress | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { categories } = useTransactionCategories('expense');
  const { summary, loading, error, refresh } = useBudgets(month);
  const periodLabel = useMemo(() => periodForMonth(month).label, [month]);

  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const changeMonth = (offset: number): void => {
    const [yearText, monthText] = month.split('-');
    const next = new Date(Number(yearText), Number(monthText) - 1 + offset, 1);
    setMonth(formatMonth(next));
    setFormOpen(false);
    setEditing(null);
  };

  const openNew = (): void => {
    setEditing(null);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (budget: BudgetProgress): void => {
    setEditing(budget);
    setFormError(null);
    setFormOpen(true);
  };

  const handleSubmit = async (values: BudgetFormValues): Promise<void> => {
    const parsed = budgetFormSchema.safeParse(values);
    if (!parsed.success) {
      setFormError('Please check the budget fields.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const service = new BudgetService(
        new SqliteBudgetRepository(database),
        new SqliteCategoryRepository(database),
        new SqliteAnalyticsRepository(database),
      );
      const input = formValuesToBudgetInput(parsed.data);
      if (editing) {
        await service.update(editing.id, input);
      } else {
        await service.create(input);
      }
      setFormOpen(false);
      setEditing(null);
      await refresh();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Budget could not be saved.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteBudget = (budget: BudgetProgress): void => {
    Alert.alert('Delete budget?', `Remove the ${budget.category?.name ?? 'overall'} budget for ${periodLabel}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { void (async () => {
        try {
          await new BudgetService(new SqliteBudgetRepository(database), new SqliteCategoryRepository(database), new SqliteAnalyticsRepository(database)).delete(budget.id);
          await refresh();
        } catch (cause) {
          setFormError(cause instanceof Error ? cause.message : 'Budget could not be deleted.');
        }
      })(); } },
    ]);
  };

  const overall = summary?.budgets.find((budget) => budget.categoryId === null);
  const categoryBudgets = summary?.budgets.filter((budget) => budget.categoryId !== null) ?? [];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={styles.iconButton}><ArrowLeft color={colors.text} size={22} /></Pressable>
          <Text style={styles.title}>Budgets</Text>
          <Pressable accessibilityLabel="Add budget" onPress={openNew} style={styles.addButton}><Plus color={colors.white} size={21} /></Pressable>
        </View>
        <View style={styles.monthSelector}>
          <Pressable accessibilityLabel="Previous month" onPress={() => changeMonth(-1)} style={styles.monthButton}><ChevronLeft color={colors.forest} size={22} /></Pressable>
          <Text style={styles.monthLabel}>{periodLabel}</Text>
          <Pressable accessibilityLabel="Next month" onPress={() => changeMonth(1)} style={styles.monthButton}><ChevronRight color={colors.forest} size={22} /></Pressable>
        </View>

        {summary ? <View style={styles.summaryCard}><Text style={styles.summaryLabel}>Monthly spending</Text><Text style={styles.summaryAmount}>{formatMMK(summary.totalSpent)}</Text><Text style={styles.summaryMeta}>{summary.totalBudget > 0 ? `${Math.round(summary.usagePercentage)}% of ${formatMMK(summary.totalBudget)}` : 'No monthly budget set yet'}</Text></View> : null}
        {formOpen ? <BudgetForm categories={categories} error={formError} initialValues={editing ? { month: editing.month, amount: String(editing.amount), categoryId: editing.categoryId ?? '' } : { month }} isEditing={Boolean(editing)} onCancel={() => { setFormOpen(false); setEditing(null); }} onSubmit={handleSubmit} submitting={submitting} /> : null}
        {loading ? <Text style={styles.status}>Loading budgets…</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && !formOpen && summary?.budgets.length === 0 ? <View style={styles.empty}><Text style={styles.emptyIcon}>🎯</Text><Text style={styles.emptyTitle}>No budgets for this month</Text><Text style={styles.emptyText}>Set an overall limit or a category limit to make your spending visible.</Text><Pressable onPress={openNew} style={styles.emptyButton}><Text style={styles.emptyButtonText}>Create a budget</Text></Pressable></View> : null}
        {overall ? <View style={styles.section}><Text style={styles.sectionTitle}>Overall</Text><BudgetCard budget={overall} onDelete={() => deleteBudget(overall)} onEdit={() => openEdit(overall)} /></View> : null}
        {categoryBudgets.length > 0 ? <View style={styles.section}><Text style={styles.sectionTitle}>Category budgets</Text>{categoryBudgets.map((budget) => <CategoryBudgetItem budget={budget} key={budget.id} onDelete={() => deleteBudget(budget)} onEdit={() => openEdit(budget)} />)}</View> : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  iconButton: { alignItems: 'center', height: 42, justifyContent: 'center', width: 42 },
  title: { color: colors.text, flex: 1, fontFamily: fontFamily.bold, fontSize: 26, textAlign: 'center' },
  addButton: { alignItems: 'center', backgroundColor: colors.forest, borderRadius: radii.md, height: 42, justifyContent: 'center', width: 42 },
  monthSelector: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginVertical: spacing.lg },
  monthButton: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: 99, height: 36, justifyContent: 'center', width: 36 },
  monthLabel: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 16 },
  summaryCard: { backgroundColor: colors.forest, borderRadius: radii.lg, marginBottom: spacing.lg, padding: spacing.lg, ...shadows.soft },
  summaryLabel: { color: colors.forestSoft, fontFamily: fontFamily.medium, fontSize: 13 },
  summaryAmount: { color: colors.white, fontFamily: fontFamily.bold, fontSize: 28, fontVariant: ['tabular-nums'], marginTop: spacing.xs },
  summaryMeta: { color: colors.forestSoft, fontFamily: fontFamily.regular, fontSize: 13, marginTop: spacing.sm },
  section: { gap: spacing.sm, marginTop: spacing.lg },
  sectionTitle: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 16, marginBottom: spacing.xs },
  status: { color: colors.textMuted, fontFamily: fontFamily.regular, marginTop: spacing.lg },
  error: { backgroundColor: '#FCEDEA', borderRadius: radii.sm, color: colors.expense, fontFamily: fontFamily.regular, marginTop: spacing.md, padding: spacing.sm },
  empty: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.md, marginTop: spacing.lg, padding: spacing.xl },
  emptyIcon: { fontSize: 34 },
  emptyTitle: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 17, marginTop: spacing.sm },
  emptyText: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 21, marginTop: spacing.xs, textAlign: 'center' },
  emptyButton: { backgroundColor: colors.forest, borderRadius: radii.sm, marginTop: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  emptyButtonText: { color: colors.white, fontFamily: fontFamily.semiBold },
});
