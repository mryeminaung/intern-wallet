import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CalendarDays, ChevronDown } from 'lucide-react-native';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { formatDisplayDate } from '../../../lib/date';
import { colors } from '../../../theme/colors';
import { radii, spacing } from '../../../theme/spacing';
import { fontFamily } from '../../../theme/typography';
import type { Category, TransactionType } from '../../../types/common';
import {
  transactionFormSchema,
  type TransactionFormValues,
} from '../schemas/transaction.schema';
import { CategorySelector } from './category-selector';

type TransactionFormProps = {
  categories: readonly Category[];
  initialValues?: Partial<TransactionFormValues>;
  submitLabel: string;
  submitting: boolean;
  error: string | null;
  autoFocusAmount?: boolean;
  recentCategoryIds?: Partial<Record<TransactionType, readonly string[]>>;
  preferredCategoryIds?: Partial<Record<TransactionType, string>>;
  onSubmit: (values: TransactionFormValues) => Promise<void>;
};

const defaultValues: TransactionFormValues = {
  type: 'expense',
  amount: '',
  categoryId: '',
  date: new Date().toISOString(),
  note: '',
};

export function TransactionForm({
  categories,
  initialValues,
  submitLabel,
  submitting,
  error,
  autoFocusAmount = false,
  recentCategoryIds,
  preferredCategoryIds,
  onSubmit,
}: TransactionFormProps): React.JSX.Element {
  const [datePicker, setDatePicker] = useState(false);
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: { ...defaultValues, ...initialValues },
    mode: 'onSubmit',
  });
  const selectedType = watch('type');
  const previousType = useRef(selectedType);
  const selectedCategoryId = watch('categoryId');
  const selectedDate = watch('date');
  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId),
    [categories, selectedCategoryId],
  );

  useEffect(() => {
    if (previousType.current !== selectedType) {
      setValue('categoryId', preferredCategoryIds?.[selectedType] ?? '');
      previousType.current = selectedType;
    } else if (selectedCategory && selectedCategory.type !== selectedType) {
      setValue('categoryId', '');
    }
  }, [preferredCategoryIds, selectedCategory, selectedType, setValue]);

  const handleDateChange = (date: Date): void => {
    setDatePicker(false);
    setValue('date', date.toISOString(), { shouldValidate: true });
  };

  const handleFormSubmit = (values: TransactionFormValues): void => {
    void onSubmit(values);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Type</Text>
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <View style={styles.segmentedControl}>
              {(['expense', 'income'] as const).map((type: TransactionType) => {
                const selected = field.value === type;
                return (
                  <Pressable
                    key={type}
                    accessibilityRole="button"
                    onPress={() => field.onChange(type)}
                    style={[styles.segment, selected && styles.segmentSelected]}
                  >
                    <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                      {type === 'expense' ? 'Expense' : 'Income'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        />

        <Text style={styles.label}>Amount</Text>
        <Controller
          control={control}
          name="amount"
          render={({ field }) => (
            <View style={styles.amountField}>
              <Text style={styles.currencyPrefix}>MMK</Text>
              <TextInput
                accessibilityLabel="Amount in MMK"
                autoFocus={autoFocusAmount}
                editable={!submitting}
                keyboardType="number-pad"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                style={styles.amountInput}
                value={field.value}
              />
            </View>
          )}
        />
        {errors.amount ? <Text style={styles.errorText}>{errors.amount.message}</Text> : null}

        <Text style={styles.label}>Category</Text>
        <CategorySelector categories={categories} onChange={(categoryId) => setValue('categoryId', categoryId, { shouldValidate: true })} recentCategoryIds={recentCategoryIds?.[selectedType]} type={selectedType} value={selectedCategoryId} />
        {errors.categoryId ? <Text style={styles.errorText}>{errors.categoryId.message}</Text> : null}

        <Text style={styles.label}>Date</Text>
        <Controller
          control={control}
          name="date"
          render={({ field }) => (
            <>
              <Pressable
                accessibilityRole="button"
                onPress={() => setDatePicker(true)}
                style={styles.selectField}
              >
                <CalendarDays color={colors.forest} size={20} />
                <Text style={styles.selectText}>{formatDisplayDate(field.value)}</Text>
                <ChevronDown color={colors.textMuted} size={18} />
              </Pressable>
              {datePicker ? (
                <DateTimePicker
                  mode="date"
                  onDismiss={() => setDatePicker(false)}
                  onValueChange={(_event, date) => handleDateChange(date)}
                  value={new Date(selectedDate)}
                />
              ) : null}
            </>
          )}
        />
        {errors.date ? <Text style={styles.errorText}>{errors.date.message}</Text> : null}

        <Text style={styles.label}>Note (optional)</Text>
        <Controller
          control={control}
          name="note"
          render={({ field }) => (
            <TextInput
              editable={!submitting}
              multiline
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="What was this for?"
              placeholderTextColor={colors.textMuted}
              style={[styles.noteInput, styles.textInput]}
              value={field.value}
            />
          )}
        />
        {errors.note ? <Text style={styles.errorText}>{errors.note.message}</Text> : null}

        {error ? <Text style={[styles.errorText, styles.formError]}>{error}</Text> : null}

        <Pressable
          accessibilityRole="button"
          disabled={submitting}
          onPress={() => { void handleSubmit(handleFormSubmit)(); }}
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        >
          {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitText}>{submitLabel}</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  label: { color: colors.text, fontFamily: fontFamily.medium, fontSize: 14, marginBottom: spacing.sm, marginTop: spacing.md },
  segmentedControl: { backgroundColor: colors.forestSoft, borderRadius: radii.md, flexDirection: 'row', padding: spacing.xs },
  segment: { alignItems: 'center', borderRadius: radii.sm, flex: 1, paddingVertical: spacing.md },
  segmentSelected: { backgroundColor: colors.forest },
  segmentText: { color: colors.forest, fontFamily: fontFamily.medium, fontSize: 15 },
  segmentTextSelected: { color: colors.white },
  amountField: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', paddingHorizontal: spacing.md },
  currencyPrefix: { color: colors.forest, fontFamily: fontFamily.semiBold, fontSize: 16, marginRight: spacing.sm },
  amountInput: { color: colors.text, flex: 1, fontFamily: fontFamily.bold, fontSize: 28, fontVariant: ['tabular-nums'], paddingVertical: spacing.md },
  selectField: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  selectText: { color: colors.text, flex: 1, fontFamily: fontFamily.medium, fontSize: 15 },
  textInput: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, color: colors.text, fontFamily: fontFamily.regular, fontSize: 15, padding: spacing.md },
  noteInput: { minHeight: 96, textAlignVertical: 'top' },
  errorText: { color: colors.expense, fontFamily: fontFamily.regular, fontSize: 13, marginTop: spacing.xs },
  formError: { backgroundColor: '#FCEDEA', borderRadius: radii.sm, padding: spacing.sm },
  submitButton: { alignItems: 'center', backgroundColor: colors.forest, borderRadius: radii.md, marginTop: spacing.xl, minHeight: 54, justifyContent: 'center' },
  submitButtonDisabled: { opacity: 0.65 },
  submitText: { color: colors.white, fontFamily: fontFamily.semiBold, fontSize: 16 },
});
