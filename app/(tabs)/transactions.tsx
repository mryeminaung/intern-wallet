import { useCallback, useMemo, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowDownLeft, ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react-native';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../../src/components/shared/Screen';
import { TransactionFilter } from '../../src/features/transactions/components/transaction-filter';
import { TransactionList } from '../../src/features/transactions/components/transaction-list';
import { useTransactionCategories } from '../../src/features/transactions/hooks/use-transaction-categories';
import { useTransactionSummary } from '../../src/features/transactions/hooks/use-transaction-summary';
import { useTransactions } from '../../src/features/transactions/hooks/use-transactions';
import { endOfDayIso, formatDisplayDate, formatMonth, periodForMonth, startOfDayIso } from '../../src/lib/date';
import { formatMMK } from '../../src/lib/currency';
import { useTransactionFilterStore } from '../../src/stores/transaction-filter.store';
import { colors } from '../../src/theme/colors';
import { fontFamily } from '../../src/theme/typography';
import { radii, shadows, spacing } from '../../src/theme/spacing';
import type { TransactionSort } from '../../src/database/repositories/transaction.repository';

type FilterDate = 'from' | 'to' | null;

export default function TransactionsScreen(): React.JSX.Element {
  const router = useRouter();
  const { type, categoryId, setType, setCategoryId, reset } = useTransactionFilterStore();
  const { categories } = useTransactionCategories();
  const [month, setMonth] = useState(formatMonth());
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [filterDate, setFilterDate] = useState<FilterDate>(null);
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sort, setSort] = useState<TransactionSort>('newest');
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const period = useMemo(() => periodForMonth(month), [month]);
  const minAmountValue = parseAmount(minAmount);
  const maxAmountValue = parseAmount(maxAmount);
  const filters = useMemo(() => ({
    type: type === 'all' ? undefined : type,
    categoryId: categoryId ?? undefined,
    fromDate: fromDate ? startOfDayIso(fromDate) : period.fromDate,
    toDate: toDate ? endOfDayIso(toDate) : period.toDate,
    search,
    minAmount: minAmountValue,
    maxAmount: maxAmountValue,
    sort,
  }), [categoryId, fromDate, maxAmountValue, minAmountValue, period.fromDate, period.toDate, search, sort, toDate, type]);
  const { transactions, loading, error, refresh } = useTransactions(filters);
  const { summary, loading: summaryLoading, error: summaryError } = useTransactionSummary(period.fromDate, period.toDate);
  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const currentMonth = formatMonth();
  const hasAdvancedFilters = Boolean(categoryId || fromDate || toDate || minAmountValue !== undefined || maxAmountValue !== undefined || sort !== 'newest');
  const hasFilters = Boolean(search || hasAdvancedFilters || type !== 'all');

  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const changeMonth = (offset: number): void => {
    const [yearText, monthText] = month.split('-');
    const next = new Date(Number(yearText), Number(monthText) - 1 + offset, 1);
    const nextMonth = formatMonth(next);
    if (nextMonth > currentMonth) return;
    setMonth(nextMonth);
    setFromDate(null);
    setToDate(null);
  };

  const handleFilterDateChange = (date: Date): void => {
    const activeFilter = filterDate;
    setFilterDate(null);
    if (!activeFilter) return;
    if (activeFilter === 'from') setFromDate(date); else setToDate(date);
  };

  const clearFilters = (): void => {
    reset();
    setSearch('');
    setFromDate(null);
    setToDate(null);
    setMinAmount('');
    setMaxAmount('');
    setSort('newest');
  };

  return <Screen>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}><Text style={styles.eyebrow}>MONEY LOG</Text><Text style={styles.title}>Activity</Text><Text style={styles.subtitle}>Every income and expense, in one place.</Text></View>
        <Pressable accessibilityLabel="Add transaction" accessibilityRole="button" onPress={() => router.push('/transactions/new')} style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}><Plus color={colors.white} size={22} /></Pressable>
      </View>

      <View style={styles.monthSelector}><Pressable accessibilityLabel="Previous month" onPress={() => changeMonth(-1)} style={styles.monthButton}><ChevronLeft color={colors.forest} size={21} /></Pressable><Text style={styles.monthLabel}>{period.label}</Text><Pressable accessibilityLabel="Next month" disabled={month >= currentMonth} onPress={() => changeMonth(1)} style={[styles.monthButton, month >= currentMonth && styles.disabled]}><ChevronRight color={month >= currentMonth ? colors.border : colors.forest} size={21} /></Pressable></View>

      <View style={styles.summaryRow}>
        <SummaryCard icon={ArrowUpRight} label="Income" value={summary?.income ?? 0} color={colors.income} background="#E5F4EB" />
        <SummaryCard icon={ArrowDownLeft} label="Expenses" value={summary?.expenses ?? 0} color={colors.expense} background="#FDECEC" />
      </View>
      {summaryLoading ? <ActivityIndicator color={colors.forest} size="small" style={styles.summaryLoading} /> : null}
      {summaryError ? <Text style={styles.summaryError}>{summaryError}</Text> : null}

      <View style={styles.filterHeading}><Text style={styles.sectionTitle}>Activity</Text>{hasFilters ? <Pressable accessibilityRole="button" onPress={clearFilters}><Text style={styles.clearText}>Clear all</Text></Pressable> : null}</View>
      <TransactionFilter advancedActive={hasAdvancedFilters} onAdvancedPress={() => setAdvancedOpen(true)} onSearchChange={setSearch} onTypeChange={setType} search={search} type={type} />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? <View style={styles.loading}><ActivityIndicator color={colors.forest} /><Text style={styles.status}>Loading transactions…</Text></View> : null}
      {!loading && transactions.length === 0 ? <View style={styles.emptyState}><Text style={styles.emptyIcon}>🧾</Text><Text style={styles.emptyTitle}>{hasFilters ? 'No matching transactions' : 'No transactions this month'}</Text><Text style={styles.emptyMessage}>{hasFilters ? 'Try clearing a filter or searching for another category.' : 'Add your first transaction to start tracking this month.'}</Text><Pressable accessibilityRole="button" onPress={() => router.push('/transactions/new')} style={styles.emptyButton}><Text style={styles.emptyButtonText}>Add transaction</Text></Pressable></View> : null}
      <TransactionList categories={categoryById} onTransactionPress={(id) => router.push(`/transactions/${id}`)} transactions={transactions} />
    </ScrollView>

    <Modal animationType="slide" onRequestClose={() => setAdvancedOpen(false)} transparent visible={advancedOpen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}><View><Text style={styles.sheetTitle}>More filters</Text><Text style={styles.sheetSubtitle}>Narrow down this month’s activity.</Text></View><Pressable accessibilityLabel="Close filters" onPress={() => setAdvancedOpen(false)} style={styles.closeButton}><X color={colors.textMuted} size={20} /></Pressable></View>
          <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView contentContainerStyle={styles.chipRow} horizontal showsHorizontalScrollIndicator={false}><Pressable onPress={() => setCategoryId(null)} style={[styles.sheetChip, !categoryId && styles.sheetChipSelected]}><Text style={[styles.sheetChipText, !categoryId && styles.sheetChipTextSelected]}>All categories</Text></Pressable>{categories.map((category) => <Pressable key={category.id} onPress={() => setCategoryId(category.id)} style={[styles.sheetChip, categoryId === category.id && styles.sheetChipSelected]}><Text style={[styles.sheetChipText, categoryId === category.id && styles.sheetChipTextSelected]}>{category.icon} {category.name}</Text></Pressable>)}</ScrollView>

            <Text style={styles.fieldLabel}>Date range</Text>
            <View style={styles.dateRow}><Pressable onPress={() => setFilterDate('from')} style={styles.dateButton}><CalendarDays color={colors.forest} size={16} /><Text style={styles.dateButtonText}>{fromDate ? formatDisplayDate(fromDate.toISOString()) : 'Start date'}</Text></Pressable><Pressable onPress={() => setFilterDate('to')} style={styles.dateButton}><CalendarDays color={colors.forest} size={16} /><Text style={styles.dateButtonText}>{toDate ? formatDisplayDate(toDate.toISOString()) : 'End date'}</Text></Pressable></View>

            <Text style={styles.fieldLabel}>Amount range · MMK</Text>
            <View style={styles.amountRow}><TextInput accessibilityLabel="Minimum amount" keyboardType="number-pad" onChangeText={setMinAmount} placeholder="Minimum" placeholderTextColor={colors.textMuted} style={styles.amountInput} value={minAmount} /><Text style={styles.amountDash}>—</Text><TextInput accessibilityLabel="Maximum amount" keyboardType="number-pad" onChangeText={setMaxAmount} placeholder="Maximum" placeholderTextColor={colors.textMuted} style={styles.amountInput} value={maxAmount} /></View>

            <Text style={styles.fieldLabel}>Sort by</Text>
            <View style={styles.sortRow}>{([['newest', 'Newest'], ['oldest', 'Oldest'], ['highest', 'Highest amount'], ['lowest', 'Lowest amount']] as const).map(([value, label]) => <Pressable key={value} onPress={() => setSort(value)} style={[styles.sortChip, sort === value && styles.sheetChipSelected]}><Text style={[styles.sheetChipText, sort === value && styles.sheetChipTextSelected]}>{label}</Text></Pressable>)}</View>
            <Pressable accessibilityRole="button" onPress={() => setAdvancedOpen(false)} style={styles.applyButton}><Text style={styles.applyButtonText}>Done</Text></Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
    {filterDate ? <DateTimePicker mode="date" onDismiss={() => setFilterDate(null)} onValueChange={(_event, date) => handleFilterDateChange(date)} value={(filterDate === 'from' ? fromDate : toDate) ?? new Date()} /> : null}
  </Screen>;
}

function SummaryCard({ icon: Icon, label, value, color, background }: { icon: typeof ArrowUpRight; label: string; value: number; color: string; background: string }): React.JSX.Element {
  return <View style={styles.summaryCard}><View style={[styles.summaryIcon, { backgroundColor: background }]}><Icon color={color} size={17} strokeWidth={2.4} /></View><Text style={styles.summaryLabel}>{label}</Text><Text adjustsFontSizeToFit minimumFontScale={0.75} numberOfLines={1} style={[styles.summaryValue, { color }]}>{formatMMK(value)}</Text></View>;
}

function parseAmount(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  headerRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  headerCopy: { flex: 1 },
  eyebrow: { color: colors.income, fontFamily: fontFamily.semiBold, fontSize: 11, letterSpacing: 1.3 },
  title: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 30, marginTop: spacing.xs },
  subtitle: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 14, marginTop: spacing.xs },
  addButton: { alignItems: 'center', backgroundColor: colors.forest, borderRadius: radii.md, height: 48, justifyContent: 'center', marginLeft: spacing.md, width: 48, ...shadows.soft },
  pressed: { opacity: 0.76 },
  monthSelector: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.md, flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg, paddingHorizontal: spacing.sm, ...shadows.soft },
  monthButton: { alignItems: 'center', height: 42, justifyContent: 'center', width: 42 },
  disabled: { opacity: 0.55 },
  monthLabel: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 15 },
  summaryRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  summaryCard: { backgroundColor: colors.surface, borderRadius: radii.md, flex: 1, minHeight: 106, padding: spacing.md, ...shadows.soft },
  summaryIcon: { alignItems: 'center', borderRadius: radii.sm, height: 32, justifyContent: 'center', width: 32 },
  summaryLabel: { color: colors.textMuted, fontFamily: fontFamily.medium, fontSize: 12, marginTop: spacing.sm },
  summaryValue: { fontFamily: fontFamily.bold, fontSize: 15, fontVariant: ['tabular-nums'], marginTop: spacing.xs },
  summaryLoading: { marginTop: spacing.sm },
  summaryError: { color: colors.expense, fontFamily: fontFamily.regular, fontSize: 12, marginTop: spacing.sm },
  filterHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xl },
  sectionTitle: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 17 },
  clearText: { color: colors.forest, fontFamily: fontFamily.medium, fontSize: 13 },
  loading: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  status: { color: colors.textMuted, fontFamily: fontFamily.regular },
  error: { backgroundColor: '#FDECEC', borderRadius: radii.sm, color: colors.expense, fontFamily: fontFamily.regular, marginTop: spacing.md, padding: spacing.sm },
  emptyState: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.md, marginTop: spacing.lg, padding: spacing.xl, ...shadows.soft },
  emptyIcon: { fontSize: 32, marginBottom: spacing.sm },
  emptyTitle: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 17 },
  emptyMessage: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 21, marginTop: spacing.xs, textAlign: 'center' },
  emptyButton: { backgroundColor: colors.forest, borderRadius: radii.sm, marginTop: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  emptyButtonText: { color: colors.white, fontFamily: fontFamily.semiBold, fontSize: 12 },
  modalOverlay: { backgroundColor: 'rgba(23, 37, 29, 0.34)', flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: '88%', paddingTop: spacing.lg },
  sheetHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg },
  sheetTitle: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 21 },
  sheetSubtitle: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 12, marginTop: spacing.xs },
  closeButton: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 99, height: 36, justifyContent: 'center', width: 36 },
  sheetContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  fieldLabel: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 13, marginBottom: spacing.sm, marginTop: spacing.lg },
  chipRow: { gap: spacing.sm },
  sheetChip: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 99, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  sheetChipSelected: { backgroundColor: colors.forest, borderColor: colors.forest },
  sheetChipText: { color: colors.textMuted, fontFamily: fontFamily.medium, fontSize: 12 },
  sheetChipTextSelected: { color: colors.white },
  dateRow: { flexDirection: 'row', gap: spacing.sm },
  dateButton: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.sm, flex: 1, flexDirection: 'row', gap: spacing.xs, minHeight: 48, paddingHorizontal: spacing.sm },
  dateButtonText: { color: colors.text, flex: 1, fontFamily: fontFamily.medium, fontSize: 12 },
  amountRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  amountInput: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.sm, borderWidth: 1, color: colors.text, flex: 1, fontFamily: fontFamily.regular, fontSize: 14, minHeight: 48, paddingHorizontal: spacing.md },
  amountDash: { color: colors.textMuted, fontFamily: fontFamily.medium },
  sortRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  sortChip: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 99, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  applyButton: { alignItems: 'center', backgroundColor: colors.forest, borderRadius: radii.md, justifyContent: 'center', marginTop: spacing.xl, minHeight: 52 },
  applyButtonText: { color: colors.white, fontFamily: fontFamily.semiBold, fontSize: 15 },
});
