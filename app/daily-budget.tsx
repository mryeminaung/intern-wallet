import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ArrowLeft, CalendarDays } from 'lucide-react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useRouter } from 'expo-router';
import { Screen } from '../src/components/shared/Screen';
import { KeyboardAwareScrollView } from '../src/components/shared/KeyboardAwareScrollView';
import { KeyboardDoneAccessory } from '../src/components/shared/KeyboardDoneAccessory';
import { SqliteSettingsRepository } from '../src/database/repositories/settings.repository';
import { settingKeys } from '../src/lib/constants';
import { formatDisplayDate, startOfDayIso } from '../src/lib/date';
import { colors } from '../src/theme/colors';
import { fontFamily } from '../src/theme/typography';
import { radii, spacing } from '../src/theme/spacing';

const DAILY_BUDGET_KEYBOARD_ACCESSORY_ID = 'daily-budget-keyboard';

type PickerMode = 'start' | 'end' | null;

export default function DailyBudgetScreen(): React.JSX.Element {
  const router = useRouter();
  const database = useSQLiteContext();
  const [dailyLimit, setDailyLimit] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [picker, setPicker] = useState<PickerMode>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const settings = new SqliteSettingsRepository(database);
      const [limit, start, end] = await Promise.all([
        settings.get(settingKeys.dailyBudgetLimit),
        settings.get(settingKeys.internshipStartDate),
        settings.get(settingKeys.internshipEndDate),
      ]);
      const loadedStart = start ? new Date(start) : null;
      const loadedEnd = end ? new Date(end) : null;
      if ((loadedStart && !Number.isFinite(loadedStart.getTime())) || (loadedEnd && !Number.isFinite(loadedEnd.getTime()))) {
        throw new Error('Invalid saved internship dates.');
      }
      setDailyLimit(limit ?? '');
      setStartDate(loadedStart);
      setEndDate(loadedEnd);
    } catch {
      setError('Budget settings could not be loaded from local storage.');
    } finally {
      setLoading(false);
    }
  }, [database]);

  useEffect(() => { void load(); }, [load]);

  const handleDateChange = (date: Date): void => {
    const active = picker;
    setPicker(null);
    if (!active) return;
    if (active === 'start') setStartDate(date); else setEndDate(date);
  };

  const save = async (): Promise<void> => {
    Keyboard.dismiss();
    setError(null);
    const parsedLimit = dailyLimit.trim() ? Number(dailyLimit) : null;
    if (parsedLimit !== null && (!Number.isSafeInteger(parsedLimit) || parsedLimit <= 0)) {
      setError('Daily limit must be a positive whole number, or left empty.');
      return;
    }
    if ((startDate && !endDate) || (!startDate && endDate)) {
      setError('Choose both an internship start and end date.');
      return;
    }
    if ((startDate && !Number.isFinite(startDate.getTime())) || (endDate && !Number.isFinite(endDate.getTime()))) {
      setError('Choose valid internship dates.');
      return;
    }
    if (startDate && endDate && startOfDayIso(startDate) > startOfDayIso(endDate)) {
      setError('The internship end date must be on or after the start date.');
      return;
    }
    setSaving(true);
    try {
      const settings = new SqliteSettingsRepository(database);
      await settings.setMany([
        { key: settingKeys.dailyBudgetLimit, value: parsedLimit === null ? '' : String(parsedLimit) },
        { key: settingKeys.internshipStartDate, value: startDate ? startOfDayIso(startDate) : '' },
        { key: settingKeys.internshipEndDate, value: endDate ? startOfDayIso(endDate) : '' },
      ]);
      router.back();
    } catch {
      setError('Daily budget settings could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  return <Screen><KeyboardAwareScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}><ArrowLeft color={colors.text} size={22} /></Pressable><Text style={styles.title}>Daily budget</Text><View style={styles.headerSpacer} /></View>
    <Text style={styles.subtitle}>Set a simple daily limit and track your four-month internship safely.</Text>
    {loading ? <ActivityIndicator color={colors.forest} style={styles.loading} /> : <View style={styles.form}>
      <Text style={styles.label}>Daily spending limit · MMK</Text>
      <TextInput accessibilityLabel="Daily spending limit" inputAccessoryViewID={DAILY_BUDGET_KEYBOARD_ACCESSORY_ID} keyboardType="number-pad" onChangeText={setDailyLimit} placeholder="For example, 15000" placeholderTextColor={colors.textMuted} style={styles.amountInput} value={dailyLimit} />
      <Text style={styles.help}>This resets each day using your device’s local calendar. Exceeding it will show a warning, but expenses are never blocked.</Text>

      <Text style={styles.label}>Internship dates</Text>
      <View style={styles.dateRow}><Pressable onPress={() => { Keyboard.dismiss(); setPicker('start'); }} style={styles.dateButton}><CalendarDays color={colors.forest} size={18} /><Text style={styles.dateText}>{startDate ? formatDisplayDate(startDate.toISOString()) : 'Start date'}</Text></Pressable><Pressable onPress={() => { Keyboard.dismiss(); setPicker('end'); }} style={styles.dateButton}><CalendarDays color={colors.forest} size={18} /><Text style={styles.dateText}>{endDate ? formatDisplayDate(endDate.toISOString()) : 'End date'}</Text></Pressable></View>
      <Text style={styles.help}>Dates power the internship progress, average daily spending, and suggested safe daily amount. They do not create recurring income.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable accessibilityRole="button" disabled={saving} onPress={() => { void save(); }} style={[styles.save, saving && styles.disabled]}>{saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveText}>Save settings</Text>}</Pressable>
    </View>}
    <KeyboardDoneAccessory nativeID={DAILY_BUDGET_KEYBOARD_ACCESSORY_ID} />
  </KeyboardAwareScrollView>{picker ? <DateTimePicker mode="date" onDismiss={() => setPicker(null)} onValueChange={(_event, date) => handleDateChange(date)} value={(picker === 'start' ? startDate : endDate) ?? new Date()} /> : null}</Screen>;
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { alignItems: 'center', flexDirection: 'row' },
  back: { alignItems: 'center', height: 42, justifyContent: 'center', width: 42 },
  headerSpacer: { width: 42 },
  title: { color: colors.text, flex: 1, fontFamily: fontFamily.bold, fontSize: 22, textAlign: 'center' },
  subtitle: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 21, marginTop: spacing.md },
  loading: { marginTop: spacing.xl },
  form: { backgroundColor: colors.surface, borderRadius: radii.md, marginTop: spacing.xl, padding: spacing.lg },
  label: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 14, marginBottom: spacing.sm, marginTop: spacing.sm },
  amountInput: { borderColor: colors.border, borderRadius: radii.sm, borderWidth: 1, color: colors.text, fontFamily: fontFamily.bold, fontSize: 24, fontVariant: ['tabular-nums'], minHeight: 56, paddingHorizontal: spacing.md },
  help: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 18, marginTop: spacing.sm },
  dateRow: { flexDirection: 'row', gap: spacing.sm },
  dateButton: { alignItems: 'center', borderColor: colors.border, borderRadius: radii.sm, borderWidth: 1, flex: 1, flexDirection: 'row', gap: spacing.xs, minHeight: 50, paddingHorizontal: spacing.sm },
  dateText: { color: colors.text, flex: 1, fontFamily: fontFamily.medium, fontSize: 11 },
  error: { backgroundColor: '#FDECEC', borderRadius: radii.sm, color: colors.expense, fontFamily: fontFamily.regular, fontSize: 12, marginTop: spacing.md, padding: spacing.sm },
  save: { alignItems: 'center', backgroundColor: colors.forest, borderRadius: radii.md, justifyContent: 'center', marginTop: spacing.xl, minHeight: 54 },
  disabled: { opacity: 0.65 },
  saveText: { color: colors.white, fontFamily: fontFamily.semiBold, fontSize: 15 },
});
