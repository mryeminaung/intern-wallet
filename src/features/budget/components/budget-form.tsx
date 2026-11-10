import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CalendarDays } from 'lucide-react-native';
import { ActivityIndicator, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardDoneAccessory } from '../../../components/shared/KeyboardDoneAccessory';
import { formatMonth } from '../../../lib/date';
import { colors } from '../../../theme/colors';
import { radii, shadows, spacing } from '../../../theme/spacing';
import { fontFamily } from '../../../theme/typography';
import type { Category } from '../../../types/common';
import { budgetFormSchema, type BudgetFormValues } from '../schemas/budget.schema';

const BUDGET_KEYBOARD_ACCESSORY_ID = 'budget-form-keyboard';

type BudgetFormProps = {
  categories: readonly Category[];
  isEditing: boolean;
  initialValues?: Partial<BudgetFormValues>;
  submitting: boolean;
  error: string | null;
  onSubmit: (values: BudgetFormValues) => Promise<void>;
  onCancel: () => void;
};

export function BudgetForm({ categories, isEditing, initialValues, submitting, error, onSubmit, onCancel }: BudgetFormProps): React.JSX.Element {
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: { month: formatMonth(), amount: '', categoryId: '', ...initialValues },
  });
  const selectedCategory = watch('categoryId');
  const month = watch('month');

  const handleDateChange = (date: Date): void => {
    setShowMonthPicker(false);
    setValue('month', formatMonth(date), { shouldValidate: true });
  };

  return (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>{isEditing ? 'Edit budget' : 'New budget'}</Text>
      <Text style={styles.label}>Month</Text>
      <Pressable onPress={() => { Keyboard.dismiss(); setShowMonthPicker(true); }} style={styles.field}><CalendarDays color={colors.forest} size={19} /><Text style={styles.fieldText}>{month}</Text></Pressable>
      {showMonthPicker ? <DateTimePicker mode="date" onDismiss={() => setShowMonthPicker(false)} onValueChange={(_event, date) => handleDateChange(date)} value={new Date(`${month}-01T12:00:00`)} /> : null}

      <Text style={styles.label}>Budget scope</Text>
      <ScrollView contentContainerStyle={styles.scopeRow} horizontal showsHorizontalScrollIndicator={false}>
        <Pressable onPress={() => setValue('categoryId', '', { shouldValidate: true })} style={[styles.scopeChip, !selectedCategory && styles.scopeSelected]}><Text style={[styles.scopeText, !selectedCategory && styles.scopeTextSelected]}>◉ Overall</Text></Pressable>
        {categories.map((category) => <Pressable key={category.id} onPress={() => setValue('categoryId', category.id, { shouldValidate: true })} style={[styles.scopeChip, selectedCategory === category.id && styles.scopeSelected]}><Text style={[styles.scopeText, selectedCategory === category.id && styles.scopeTextSelected]}>{category.icon} {category.name}</Text></Pressable>)}
      </ScrollView>

      <Text style={styles.label}>Monthly limit</Text>
      <Controller control={control} name="amount" render={({ field }) => <View style={styles.amountField}><Text style={styles.currency}>MMK</Text><TextInput editable={!submitting} inputAccessoryViewID={BUDGET_KEYBOARD_ACCESSORY_ID} keyboardType="number-pad" onBlur={field.onBlur} onChangeText={field.onChange} placeholder="0" placeholderTextColor={colors.textMuted} style={styles.amountInput} value={field.value} /></View>} />
      {errors.amount ? <Text style={styles.error}>{errors.amount.message}</Text> : null}
      {errors.month ? <Text style={styles.error}>{errors.month.message}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.formActions}>
        <Pressable disabled={submitting} onPress={onCancel} style={styles.cancelButton}><Text style={styles.cancelText}>Cancel</Text></Pressable>
        <Pressable disabled={submitting} onPress={() => { Keyboard.dismiss(); void handleSubmit((values) => onSubmit(values))(); }} style={styles.saveButton}>{submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveText}>Save budget</Text>}</Pressable>
      </View>
      <KeyboardDoneAccessory nativeID={BUDGET_KEYBOARD_ACCESSORY_ID} />
    </View>
  );
}

const styles = StyleSheet.create({
  formCard: { backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.md, ...shadows.soft },
  formTitle: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 18, marginBottom: spacing.md },
  label: { color: colors.text, fontFamily: fontFamily.medium, fontSize: 13, marginBottom: spacing.xs, marginTop: spacing.sm },
  field: { alignItems: 'center', borderColor: colors.border, borderRadius: radii.sm, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  fieldText: { color: colors.text, fontFamily: fontFamily.medium, fontSize: 15 },
  scopeRow: { gap: spacing.sm, paddingVertical: spacing.xs },
  scopeChip: { borderColor: colors.border, borderRadius: 99, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  scopeSelected: { backgroundColor: colors.forest, borderColor: colors.forest },
  scopeText: { color: colors.textMuted, fontFamily: fontFamily.medium, fontSize: 12 },
  scopeTextSelected: { color: colors.white },
  amountField: { alignItems: 'center', borderColor: colors.border, borderRadius: radii.sm, borderWidth: 1, flexDirection: 'row', paddingHorizontal: spacing.md },
  currency: { color: colors.forest, fontFamily: fontFamily.semiBold, marginRight: spacing.sm },
  amountInput: { color: colors.text, flex: 1, fontFamily: fontFamily.bold, fontSize: 20, fontVariant: ['tabular-nums'], paddingVertical: spacing.sm },
  error: { color: colors.expense, fontFamily: fontFamily.regular, fontSize: 12, marginTop: spacing.xs },
  formActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  cancelButton: { alignItems: 'center', borderColor: colors.border, borderRadius: radii.sm, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 46 },
  cancelText: { color: colors.textMuted, fontFamily: fontFamily.semiBold },
  saveButton: { alignItems: 'center', backgroundColor: colors.forest, borderRadius: radii.sm, flex: 1, justifyContent: 'center', minHeight: 46 },
  saveText: { color: colors.white, fontFamily: fontFamily.semiBold },
});
