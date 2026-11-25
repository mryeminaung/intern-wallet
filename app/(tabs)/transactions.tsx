import { useCallback, useMemo, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react-native';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '@/components/shared/Screen';
import { KeyboardDoneAccessory } from '@/components/shared/KeyboardDoneAccessory';
import {
  TransactionFilter,
  TransactionList,
  useTransactionCategories,
  useTransactions,
  useTransactionSummary,
  useBankNames,
} from '@/features/transactions';

import { endOfDayIso, formatDisplayDate, formatMonth, periodForMonth, startOfDayIso } from '@/lib/date';
import { formatMMK } from '@/lib/currency';
import { useTransactionFilterStore } from '@/stores/transaction-filter.store';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { radii, shadows, spacing } from '@/theme/spacing';
import type { TransactionSort } from '@/database/repositories/transaction.repository';
import { defaultBankNames } from '@/lib/money-source';
import { sourceLabel } from '@/lib/money-source';
import { SqliteTransferRepository } from '@/database/repositories/transfer.repository';
import { useSQLiteContext } from 'expo-sqlite';
import type { Transfer } from '@/types/common';

type FilterDate = 'from' | 'to' | null;
const FILTER_KEYBOARD_ACCESSORY_ID = 'transaction-filter-keyboard';

export default function TransactionsScreen(): React.JSX.Element {
  const router = useRouter();
  const database = useSQLiteContext();
  const [transfers, setTransfers] = useState<readonly Transfer[]>([]);
  const { type, categoryId, sourceKey, setType, setCategoryId, setSourceKey, reset } = useTransactionFilterStore();
  const { categories } = useTransactionCategories();
  const bankNames = useBankNames();
  const availableBankNames = useMemo(() => [...new Set([...defaultBankNames, ...bankNames])], [bankNames]);
  const [month, setMonth] = useState(formatMonth());
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [filterDate, setFilterDate] = useState<FilterDate>(null);
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sort, setSort] = useState<TransactionSort>('newest');
  const [draftCategoryId, setDraftCategoryId] = useState<string | null>(null);
  const [draftSourceKey, setDraftSourceKey] = useState<string | null>(null);
  const [draftFromDate, setDraftFromDate] = useState<Date | null>(null);
  const [draftToDate, setDraftToDate] = useState<Date | null>(null);
  const [draftMinAmount, setDraftMinAmount] = useState('');
  const [draftMaxAmount, setDraftMaxAmount] = useState('');
  const [draftSort, setDraftSort] = useState<TransactionSort>('newest');
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const period = useMemo(() => periodForMonth(month), [month]);
  const searchAllDates = Boolean(search.trim() || sourceKey) && !fromDate && !toDate;
  const minAmountValue = parseAmount(minAmount);
  const maxAmountValue = parseAmount(maxAmount);
  const filters = useMemo(() => ({
    type: type === 'all' ? undefined : type,
    categoryId: categoryId ?? undefined,
    sourceKey: sourceKey ?? undefined,
    fromDate: fromDate ? startOfDayIso(fromDate) : searchAllDates ? undefined : period.fromDate,
    toDate: toDate ? endOfDayIso(toDate) : searchAllDates ? undefined : period.toDate,
    search,
    minAmount: minAmountValue,
    maxAmount: maxAmountValue,
    sort,
  }), [categoryId, sourceKey, fromDate, maxAmountValue, minAmountValue, period.fromDate, period.toDate, search, searchAllDates, sort, toDate, type]);
  const { transactions, loading, error, refresh } = useTransactions(filters);
  const { summary, loading: summaryLoading, error: summaryError } = useTransactionSummary(period.fromDate, period.toDate);
  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const currentMonth = formatMonth();
  const hasAdvancedFilters = Boolean(categoryId || sourceKey || fromDate || toDate || minAmountValue !== undefined || maxAmountValue !== undefined || sort !== 'newest');
  const hasFilters = Boolean(search || hasAdvancedFilters || type !== 'all');
  const filteredTotals = useMemo(() => transactions.reduce((totals, transaction) => {
    if (transaction.type === 'income') totals.income += transaction.amount;
    else totals.expenses += transaction.amount;
    return totals;
  }, { income: 0, expenses: 0 }), [transactions]);
  const visibleTransfers = useMemo(() => transfers.filter((transfer) => {
    if (type !== 'all' || categoryId) return false;
    if (fromDate && transfer.date < startOfDayIso(fromDate)) return false;
    if (toDate && transfer.date > endOfDayIso(toDate)) return false;
    if (minAmountValue !== undefined && transfer.amount < minAmountValue) return false;
    if (maxAmountValue !== undefined && transfer.amount > maxAmountValue) return false;
    const term = search.trim().toLocaleLowerCase();
    return !term || [transfer.note ?? '', sourceLabel(transfer.fromSourceKey), sourceLabel(transfer.toSourceKey)].some((value) => value.toLocaleLowerCase().includes(term));
  }).sort((a, b) => sort === 'highest' ? b.amount - a.amount : sort === 'lowest' ? a.amount - b.amount : sort === 'oldest' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)), [transfers, type, categoryId, fromDate, toDate, minAmountValue, maxAmountValue, search, sort]);
  const displayedTotals = hasFilters ? filteredTotals : summary;
  const invalidDateRange = Boolean(draftFromDate && draftToDate && startOfDayIso(draftFromDate) > startOfDayIso(draftToDate));
  const draftMinValue = parseAmount(draftMinAmount);
  const draftMaxValue = parseAmount(draftMaxAmount);
  const invalidAmountRange = Boolean(
    (draftMinAmount.trim() && draftMinValue === undefined)
    || (draftMaxAmount.trim() && draftMaxValue === undefined)
    || (draftMinValue !== undefined && draftMaxValue !== undefined && draftMinValue > draftMaxValue),
  );

  useFocusEffect(useCallback(() => {
    void refresh();
    void new SqliteTransferRepository(database).list(searchAllDates ? undefined : period.fromDate, searchAllDates ? undefined : period.toDate, sourceKey ?? undefined).then(setTransfers).catch(() => setTransfers([]));
  }, [database, period.fromDate, period.toDate, refresh, searchAllDates, sourceKey]));

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
    if (activeFilter === 'from') setDraftFromDate(date); else setDraftToDate(date);
  };

  const openAdvanced = (): void => {
    setDraftCategoryId(categoryId);
    setDraftSourceKey(sourceKey);
    setDraftFromDate(fromDate);
    setDraftToDate(toDate);
    setDraftMinAmount(minAmount);
    setDraftMaxAmount(maxAmount);
    setDraftSort(sort);
    setAdvancedOpen(true);
  };

  const closeAdvanced = (): void => {
    Keyboard.dismiss();
    setFilterDate(null);
    setAdvancedOpen(false);
  };

  const applyAdvanced = (): void => {
    if (invalidDateRange || invalidAmountRange) return;
    setCategoryId(draftCategoryId);
    setSourceKey(draftSourceKey);
    setFromDate(draftFromDate);
    setToDate(draftToDate);
    setMinAmount(draftMinAmount);
    setMaxAmount(draftMaxAmount);
    setSort(draftSort);
    closeAdvanced();
  };

  const resetAdvancedDraft = (): void => {
    setDraftCategoryId(null);
    setDraftSourceKey(null);
    setDraftFromDate(null);
    setDraftToDate(null);
    setDraftMinAmount('');
    setDraftMaxAmount('');
    setDraftSort('newest');
  };

  const clearFilters = (): void => {
    reset();
    setSearch('');
    setFromDate(null);
    setToDate(null);
    setMinAmount('');
    setMaxAmount('');
    setSort('newest');
    resetAdvancedDraft();
  };

  return <Screen>
    <ScrollView contentContainerStyle={styles.content} keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}><Text style={styles.title}>Activity</Text><Text style={styles.subtitle}>Every income and expense, in one place.</Text></View>
        <Pressable accessibilityLabel="Add transaction" accessibilityRole="button" onPress={() => router.push('/transactions/new')} style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}><Plus color={colors.white} size={22} /></Pressable>
      </View>
      <Pressable accessibilityRole="button" onPress={() => router.push('/transfers/new')} style={styles.transferAction}><ArrowLeftRight color={colors.forest} size={17} /><Text style={styles.transferActionText}>Transfer money</Text></Pressable>

      {searchAllDates ? <Text style={styles.searchScope}>Showing all dates</Text> : <View style={styles.monthSelector}><Pressable accessibilityLabel="Previous month" onPress={() => changeMonth(-1)} style={styles.monthButton}><ChevronLeft color={colors.forest} size={21} /></Pressable><Text style={styles.monthLabel}>{period.label}</Text><Pressable accessibilityLabel="Next month" disabled={month >= currentMonth} onPress={() => changeMonth(1)} style={[styles.monthButton, month >= currentMonth && styles.disabled]}><ChevronRight color={month >= currentMonth ? colors.border : colors.forest} size={21} /></Pressable></View>}

      <View style={styles.summaryRow}>
        <SummaryCard icon={ArrowUpRight} label={hasFilters ? 'Filtered income' : 'Income'} value={displayedTotals?.income ?? 0} color={colors.income} background="#E5F4EB" />
        <SummaryCard icon={ArrowDownLeft} label={hasFilters ? 'Filtered expenses' : 'Expenses'} value={displayedTotals?.expenses ?? 0} color={colors.expense} background="#FDECEC" />
      </View>
      {!hasFilters && summaryLoading ? <ActivityIndicator color={colors.forest} size="small" style={styles.summaryLoading} /> : null}
      {!hasFilters && summaryError ? <Text style={styles.summaryError}>{summaryError}</Text> : null}

      <View style={styles.filterHeading}><Text style={styles.sectionTitle}>Transactions</Text>{hasFilters ? <Pressable accessibilityRole="button" onPress={clearFilters}><Text style={styles.clearText}>Clear all</Text></Pressable> : null}</View>
      <TransactionFilter advancedActive={hasAdvancedFilters} onAdvancedPress={openAdvanced} onSearchChange={setSearch} onTypeChange={setType} search={search} type={type} />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? <View style={styles.loading}><ActivityIndicator color={colors.forest} /><Text style={styles.status}>Loading transactions…</Text></View> : null}
      {!loading && transactions.length === 0 && visibleTransfers.length === 0 ? <View style={styles.emptyState}><Text style={styles.emptyIcon}>🧾</Text><Text style={styles.emptyTitle}>{hasFilters ? 'No matching activity' : 'No activity this month'}</Text><Text style={styles.emptyMessage}>{hasFilters ? 'Try clearing a filter or searching again.' : 'Add your first transaction to start tracking this month.'}</Text><Pressable accessibilityRole="button" onPress={() => router.push('/transactions/new')} style={styles.emptyButton}><Text style={styles.emptyButtonText}>Add transaction</Text></Pressable></View> : null}
      <TransactionList categories={categoryById} onTransactionPress={(id) => router.push(`/transactions/${id}`)} transactions={transactions} />
      {visibleTransfers.length > 0 ? <View style={styles.transferSection}><Text style={styles.sectionTitle}>Transfers</Text>{visibleTransfers.map((transfer) => <Pressable accessibilityRole="button" key={transfer.id} onPress={() => router.push(`/transfers/${transfer.id}`)} style={styles.transferRow}><ArrowLeftRight color={colors.forest} size={18} /><View style={styles.transferCopy}><Text style={styles.transferTitle}>{sourceLabel(transfer.fromSourceKey)} → {sourceLabel(transfer.toSourceKey)}</Text><Text style={styles.transferDate}>{formatDisplayDate(transfer.date)}</Text></View><Text style={styles.transferAmount}>{formatMMK(transfer.amount)}</Text><ChevronRight color={colors.textMuted} size={16} /></Pressable>)}</View> : null}
    </ScrollView>

    <Modal animationType="slide" onRequestClose={closeAdvanced} transparent visible={advancedOpen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}><View><Text style={styles.sheetTitle}>More filters</Text><Text style={styles.sheetSubtitle}>Choose filters, then apply them.</Text></View><Pressable accessibilityLabel="Close filters without applying" onPress={closeAdvanced} style={styles.closeButton}><X color={colors.textMuted} size={20} /></Pressable></View>
          <ScrollView contentContainerStyle={styles.sheetContent} keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView contentContainerStyle={styles.chipRow} horizontal showsHorizontalScrollIndicator={false}><Pressable onPress={() => setDraftCategoryId(null)} style={[styles.sheetChip, !draftCategoryId && styles.sheetChipSelected]}><Text style={[styles.sheetChipText, !draftCategoryId && styles.sheetChipTextSelected]}>All categories</Text></Pressable>{categories.map((category) => <Pressable key={category.id} onPress={() => setDraftCategoryId(category.id)} style={[styles.sheetChip, draftCategoryId === category.id && styles.sheetChipSelected]}><Text style={[styles.sheetChipText, draftCategoryId === category.id && styles.sheetChipTextSelected]}>{category.icon} {category.name}</Text></Pressable>)}</ScrollView>

            <Text style={styles.fieldLabel}>Cash or bank</Text>
            <ScrollView contentContainerStyle={styles.chipRow} horizontal showsHorizontalScrollIndicator={false}>
              {[[null, 'All'], ['cash', 'Cash'], ...availableBankNames.map((name) => [`bank:${name}`, name]), ['unspecified', 'Unspecified']].map(([key, label]) => <Pressable accessibilityRole="button" key={key ?? 'all'} onPress={() => setDraftSourceKey(key)} style={[styles.sheetChip, draftSourceKey === key && styles.sheetChipSelected]}><Text style={[styles.sheetChipText, draftSourceKey === key && styles.sheetChipTextSelected]}>{label}</Text></Pressable>)}
            </ScrollView>

            <Text style={styles.fieldLabel}>Date range</Text>
            <View style={styles.dateRow}><Pressable onPress={() => { Keyboard.dismiss(); setFilterDate('from'); }} style={styles.dateButton}><CalendarDays color={colors.forest} size={16} /><Text style={styles.dateButtonText}>{draftFromDate ? formatDisplayDate(draftFromDate.toISOString()) : 'Start date'}</Text></Pressable><Pressable onPress={() => { Keyboard.dismiss(); setFilterDate('to'); }} style={styles.dateButton}><CalendarDays color={colors.forest} size={16} /><Text style={styles.dateButtonText}>{draftToDate ? formatDisplayDate(draftToDate.toISOString()) : 'End date'}</Text></Pressable></View>
            {invalidDateRange ? <Text style={styles.dateError}>End date must be on or after start date.</Text> : null}

            <Text style={styles.fieldLabel}>Amount range · MMK</Text>
            <View style={styles.amountRow}><TextInput accessibilityLabel="Minimum amount" inputAccessoryViewID={FILTER_KEYBOARD_ACCESSORY_ID} keyboardType="number-pad" onChangeText={setDraftMinAmount} placeholder="Minimum" placeholderTextColor={colors.textMuted} style={styles.amountInput} value={draftMinAmount} /><Text style={styles.amountDash}>—</Text><TextInput accessibilityLabel="Maximum amount" inputAccessoryViewID={FILTER_KEYBOARD_ACCESSORY_ID} keyboardType="number-pad" onChangeText={setDraftMaxAmount} placeholder="Maximum" placeholderTextColor={colors.textMuted} style={styles.amountInput} value={draftMaxAmount} /></View>
            {invalidAmountRange ? <Text style={styles.dateError}>Enter whole-number amounts; minimum must not exceed maximum.</Text> : null}

            <Text style={styles.fieldLabel}>Sort by</Text>
            <View style={styles.sortRow}>{([['newest', 'Newest'], ['oldest', 'Oldest'], ['highest', 'Highest amount'], ['lowest', 'Lowest amount']] as const).map(([value, label]) => <Pressable key={value} onPress={() => setDraftSort(value)} style={[styles.sortChip, draftSort === value && styles.sheetChipSelected]}><Text style={[styles.sheetChipText, draftSort === value && styles.sheetChipTextSelected]}>{label}</Text></Pressable>)}</View>
            <KeyboardDoneAccessory nativeID={FILTER_KEYBOARD_ACCESSORY_ID} />
          </ScrollView>
          <View style={styles.sheetFooter}><Pressable accessibilityRole="button" onPress={resetAdvancedDraft} style={styles.resetButton}><Text style={styles.resetButtonText}>Reset</Text></Pressable><Pressable accessibilityRole="button" disabled={invalidDateRange || invalidAmountRange} onPress={applyAdvanced} style={[styles.applyButton, (invalidDateRange || invalidAmountRange) && styles.applyButtonDisabled]}><Text style={styles.applyButtonText}>Apply filters</Text></Pressable></View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
    {filterDate ? <DateTimePicker mode="date" onDismiss={() => setFilterDate(null)} onValueChange={(_event, date) => handleFilterDateChange(date)} value={(filterDate === 'from' ? draftFromDate : draftToDate) ?? new Date()} /> : null}
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
  searchScope: { color: colors.textMuted, fontFamily: fontFamily.medium, fontSize: 13, marginTop: spacing.md },
  transferAction: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: spacing.xs, minHeight: 44, marginTop: spacing.sm },
  transferActionText: { color: colors.forest, fontFamily: fontFamily.semiBold, fontSize: 13 },
  transferSection: { marginTop: spacing.lg },
  transferRow: { alignItems: 'center', backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: spacing.sm, minHeight: 64, paddingHorizontal: spacing.md },
  transferCopy: { flex: 1 }, transferTitle: { color: colors.text, fontFamily: fontFamily.medium, fontSize: 13 }, transferDate: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 11, marginTop: 2 },
  transferAmount: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 13 },
  content: { paddingHorizontal: spacing.screenHorizontal, paddingTop: spacing.screenTop, paddingBottom: spacing.tabBarClearance },
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
  sheetContent: { paddingHorizontal: spacing.screenHorizontal, paddingBottom: spacing.md },
  fieldLabel: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 13, marginBottom: spacing.sm, marginTop: spacing.lg },
  chipRow: { gap: spacing.sm },
  sheetChip: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 99, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  sheetChipSelected: { backgroundColor: colors.forest, borderColor: colors.forest },
  sheetChipText: { color: colors.textMuted, fontFamily: fontFamily.medium, fontSize: 12 },
  sheetChipTextSelected: { color: colors.white },
  dateRow: { flexDirection: 'row', gap: spacing.sm },
  dateButton: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.sm, flex: 1, flexDirection: 'row', gap: spacing.xs, minHeight: 48, paddingHorizontal: spacing.sm },
  dateButtonText: { color: colors.text, flex: 1, fontFamily: fontFamily.medium, fontSize: 12 },
  dateError: { color: colors.expense, fontFamily: fontFamily.regular, fontSize: 12, marginTop: spacing.xs },
  amountRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  amountInput: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.sm, borderWidth: 1, color: colors.text, flex: 1, fontFamily: fontFamily.regular, fontSize: 14, minHeight: 48, paddingHorizontal: spacing.md },
  amountDash: { color: colors.textMuted, fontFamily: fontFamily.medium },
  sortRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  sortChip: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 99, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  sheetFooter: { alignItems: 'center', backgroundColor: colors.background, borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.screenHorizontal, paddingTop: spacing.sm, paddingBottom: spacing.md },
  resetButton: { alignItems: 'center', borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, justifyContent: 'center', minHeight: 50, paddingHorizontal: spacing.lg },
  resetButtonText: { color: colors.forest, fontFamily: fontFamily.semiBold, fontSize: 14 },
  applyButton: { alignItems: 'center', backgroundColor: colors.forest, borderRadius: radii.md, flex: 1, justifyContent: 'center', minHeight: 50 },
  applyButtonDisabled: { opacity: 0.5 },
  applyButtonText: { color: colors.white, fontFamily: fontFamily.semiBold, fontSize: 15 },
});
