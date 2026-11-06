import { useMemo, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { CalendarDays, Check, ChevronLeft, ShieldCheck, Sparkles, WalletCards } from 'lucide-react-native';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../src/components/shared/Screen';
import { SqliteCategoryRepository } from '../src/database/repositories/category.repository';
import { SqliteSettingsRepository } from '../src/database/repositories/settings.repository';
import { SqliteTransactionRepository } from '../src/database/repositories/transaction.repository';
import { OnboardingService, recommendedDailyLimit } from '../src/features/onboarding/services/onboarding.service';
import { TransactionService } from '../src/features/transactions/services/transaction.service';
import { formatMMK } from '../src/lib/currency';
import { calendarDaysInclusive, formatDisplayDate } from '../src/lib/date';
import { colors } from '../src/theme/colors';
import { radii, shadows, spacing } from '../src/theme/spacing';
import { fontFamily } from '../src/theme/typography';

type PickerField = 'start' | 'end' | null;

export default function OnboardingScreen(): React.JSX.Element {
  const router = useRouter();
  const database = useSQLiteContext();
  const service = useMemo(() => new OnboardingService(
    new SqliteSettingsRepository(database),
    new TransactionService(new SqliteTransactionRepository(database), new SqliteCategoryRepository(database)),
  ), [database]);
  const [step, setStep] = useState(0);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(() => { const date = new Date(); date.setMonth(date.getMonth() + 3); return date; });
  const [startingBalance, setStartingBalance] = useState('');
  const [dailyLimit, setDailyLimit] = useState('');
  const [picker, setPicker] = useState<PickerField>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recommendation = recommendedDailyLimit(parseAmount(startingBalance) ?? 0, startDate, endDate);

  const handleDateChange = (date: Date): void => {
    const field = picker;
    setPicker(null);
    if (!field) return;
    if (field === 'start') {
      setStartDate(date);
      if (date.getTime() > endDate.getTime()) setEndDate(date);
    } else {
      setEndDate(date);
    }
    setError(null);
  };

  const next = (): void => {
    setError(null);
    if (step === 1 && calendarDaysInclusive(startDate, endDate) === 0) {
      setError('The internship end date must be on or after the start date.');
      return;
    }
    if (step === 2 && parseAmount(startingBalance) === null) {
      setError('Enter a positive whole number or leave the balance empty.');
      return;
    }
    if (step === 2 && !dailyLimit && recommendation > 0) setDailyLimit(String(recommendation));
    setStep((current) => Math.min(3, current + 1));
  };

  const finish = async (): Promise<void> => {
    const balance = parseAmount(startingBalance);
    const limit = dailyLimit.trim() ? parsePositiveAmount(dailyLimit) : null;
    if (balance === null) { setError('Enter a valid starting balance.'); return; }
    if (dailyLimit.trim() && limit === null) { setError('Enter a positive whole-number daily limit.'); return; }
    setBusy(true); setError(null);
    try {
      await database.withTransactionAsync(async () => {
        await service.complete({ internshipStartDate: startDate.toISOString(), internshipEndDate: endDate.toISOString(), startingBalance: balance, dailyLimit: limit });
      });
      router.replace('/');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Setup could not be saved.');
    } finally {
      setBusy(false);
    }
  };

  const skip = async (): Promise<void> => {
    if (busy) return;
    setBusy(true); setError(null);
    try { await service.skip(); router.replace('/'); }
    catch { setError('Setup could not be skipped. Please try again.'); }
    finally { setBusy(false); }
  };

  return <Screen><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
    <View style={styles.topBar}>{step > 0 ? <Pressable accessibilityLabel="Previous step" accessibilityRole="button" disabled={busy} onPress={() => { setStep((current) => Math.max(0, current - 1)); setError(null); }} style={styles.back}><ChevronLeft color={colors.text} size={22} /></Pressable> : <View style={styles.back} />}<View style={styles.progress}><View style={[styles.progressFill, { width: `${(step + 1) * 25}%` }]} /></View><Pressable accessibilityRole="button" disabled={busy} onPress={() => { void skip(); }}><Text style={styles.skip}>Skip</Text></Pressable></View>

    {step === 0 ? <WelcomeStep /> : null}
    {step === 1 ? <DatesStep endDate={endDate} onOpenPicker={setPicker} startDate={startDate} /> : null}
    {step === 2 ? <BalanceStep value={startingBalance} onChange={setStartingBalance} /> : null}
    {step === 3 ? <PlanStep dailyLimit={dailyLimit} days={calendarDaysInclusive(new Date().getTime() < startDate.getTime() ? startDate : new Date(), endDate)} onChange={setDailyLimit} recommendation={recommendation} startingBalance={parseAmount(startingBalance) ?? 0} /> : null}

    {error ? <Text style={styles.error}>{error}</Text> : null}
    <Pressable accessibilityRole="button" disabled={busy} onPress={() => { if (step === 3) void finish(); else next(); }} style={[styles.primary, busy && styles.disabled]}>{busy ? <ActivityIndicator color={colors.white} /> : <><Text style={styles.primaryText}>{step === 0 ? 'Set up my wallet' : step === 3 ? 'Start using Intern Wallet' : 'Continue'}</Text>{step === 3 ? <Check color={colors.white} size={18} /> : null}</>}</Pressable>
    {step === 0 ? <Text style={styles.footnote}>Takes about a minute. You can change everything later from Plan.</Text> : null}
    {picker ? <DateTimePicker minimumDate={picker === 'end' ? startDate : undefined} mode="date" onDismiss={() => setPicker(null)} onValueChange={(_event, date) => handleDateChange(date)} value={picker === 'start' ? startDate : endDate} /> : null}
  </ScrollView></KeyboardAvoidingView></Screen>;
}

function WelcomeStep(): React.JSX.Element {
  return <View style={styles.step}><Image accessibilityIgnoresInvertColors source={require('../assets/icon.png')} style={styles.logo} /><Text style={styles.eyebrow}>WELCOME TO INTERN WALLET</Text><Text style={styles.title}>Make your money last through your internship.</Text><Text style={styles.subtitle}>A short setup will turn your balance and internship dates into a useful daily spending guide.</Text><View style={styles.privacy}><ShieldCheck color={colors.forest} size={21} /><View style={styles.privacyCopy}><Text style={styles.privacyTitle}>Private by default</Text><Text style={styles.privacyText}>Your financial information stays in the SQLite database on this device.</Text></View></View></View>;
}

function DatesStep({ startDate, endDate, onOpenPicker }: { startDate: Date; endDate: Date; onOpenPicker: (field: PickerField) => void }): React.JSX.Element {
  return <View style={styles.step}><View style={styles.stepIcon}><CalendarDays color={colors.forest} size={24} /></View><Text style={styles.eyebrow}>STEP 1 OF 3</Text><Text style={styles.title}>When is your internship?</Text><Text style={styles.subtitle}>We use this period to calculate how many spending days remain.</Text><Text style={styles.label}>Start date</Text><DateButton date={startDate} onPress={() => onOpenPicker('start')} /><Text style={styles.label}>End date</Text><DateButton date={endDate} onPress={() => onOpenPicker('end')} /></View>;
}

function BalanceStep({ value, onChange }: { value: string; onChange: (value: string) => void }): React.JSX.Element {
  return <View style={styles.step}><View style={styles.stepIcon}><WalletCards color={colors.forest} size={24} /></View><Text style={styles.eyebrow}>STEP 2 OF 3</Text><Text style={styles.title}>How much money is available now?</Text><Text style={styles.subtitle}>Include savings or cash you can use during the internship. You can leave this empty and add income later.</Text><Text style={styles.label}>Starting balance</Text><View style={styles.amountField}><Text style={styles.currency}>MMK</Text><TextInput accessibilityLabel="Starting balance in MMK" autoFocus keyboardType="number-pad" onChangeText={onChange} placeholder="0" placeholderTextColor={colors.textMuted} style={styles.amountInput} value={value} /></View><Text style={styles.helper}>This will be saved once as Personal Savings with the note “Opening balance.”</Text></View>;
}

function PlanStep({ startingBalance, recommendation, dailyLimit, days, onChange }: { startingBalance: number; recommendation: number; dailyLimit: string; days: number; onChange: (value: string) => void }): React.JSX.Element {
  return <View style={styles.step}><View style={styles.stepIcon}><Sparkles color={colors.forest} size={24} /></View><Text style={styles.eyebrow}>STEP 3 OF 3</Text><Text style={styles.title}>Your starting daily plan</Text><Text style={styles.subtitle}>This is a guide, not a restriction. Adjust it whenever your situation changes.</Text><View style={styles.recommendation}><Text style={styles.recommendationLabel}>RECOMMENDED PER DAY</Text><Text style={styles.recommendationAmount}>{formatMMK(recommendation)}</Text><Text style={styles.recommendationText}>{formatMMK(startingBalance)} across {Math.max(0, days)} spending days</Text></View><Text style={styles.label}>Daily limit (optional)</Text><View style={styles.amountField}><Text style={styles.currency}>MMK</Text><TextInput accessibilityLabel="Daily spending limit in MMK" keyboardType="number-pad" onChangeText={onChange} placeholder="Add later" placeholderTextColor={colors.textMuted} style={styles.amountInput} value={dailyLimit} /></View></View>;
}

function DateButton({ date, onPress }: { date: Date; onPress: () => void }): React.JSX.Element {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.dateButton, pressed && styles.pressed]}><CalendarDays color={colors.forest} size={19} /><Text style={styles.dateText}>{formatDisplayDate(date.toISOString())}</Text></Pressable>;
}

function parseAmount(value: string): number | null {
  if (!value.trim()) return 0;
  if (!/^\d+$/.test(value.trim())) return null;
  const amount = Number(value);
  return Number.isSafeInteger(amount) && amount >= 0 ? amount : null;
}

function parsePositiveAmount(value: string): number | null {
  const amount = parseAmount(value);
  return amount !== null && amount > 0 ? amount : null;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, padding: spacing.lg, paddingBottom: spacing.xxl },
  topBar: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between' },
  back: { alignItems: 'center', height: 42, justifyContent: 'center', width: 42 },
  progress: { backgroundColor: colors.border, borderRadius: 99, flex: 1, height: 5, overflow: 'hidden' },
  progressFill: { backgroundColor: colors.forest, borderRadius: 99, height: '100%' },
  skip: { color: colors.forest, fontFamily: fontFamily.semiBold, fontSize: 13 },
  step: { marginTop: spacing.xl },
  logo: { borderRadius: radii.lg, height: 82, width: 82 },
  stepIcon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: radii.md, height: 52, justifyContent: 'center', width: 52 },
  eyebrow: { color: colors.income, fontFamily: fontFamily.semiBold, fontSize: 11, letterSpacing: 1.2, marginTop: spacing.lg },
  title: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 29, lineHeight: 36, marginTop: spacing.sm },
  subtitle: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 21, marginTop: spacing.sm },
  privacy: { alignItems: 'flex-start', backgroundColor: colors.forestSoft, borderRadius: radii.md, flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl, padding: spacing.md },
  privacyCopy: { flex: 1 },
  privacyTitle: { color: colors.forest, fontFamily: fontFamily.semiBold, fontSize: 14 },
  privacyText: { color: colors.forestDark, fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 18, marginTop: 3 },
  label: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 13, marginBottom: spacing.sm, marginTop: spacing.lg },
  dateButton: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, minHeight: 54, paddingHorizontal: spacing.md },
  dateText: { color: colors.text, fontFamily: fontFamily.medium, fontSize: 15 },
  amountField: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', minHeight: 64, paddingHorizontal: spacing.md },
  currency: { color: colors.forest, fontFamily: fontFamily.semiBold, fontSize: 15, marginRight: spacing.sm },
  amountInput: { color: colors.text, flex: 1, fontFamily: fontFamily.bold, fontSize: 27, fontVariant: ['tabular-nums'], paddingVertical: spacing.sm },
  helper: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 11, lineHeight: 17, marginTop: spacing.sm },
  recommendation: { backgroundColor: colors.forest, borderRadius: radii.lg, marginTop: spacing.xl, padding: spacing.lg, ...shadows.floating },
  recommendationLabel: { color: '#A7F3D0', fontFamily: fontFamily.semiBold, fontSize: 10, letterSpacing: 1 },
  recommendationAmount: { color: colors.white, fontFamily: fontFamily.bold, fontSize: 31, fontVariant: ['tabular-nums'], marginTop: spacing.xs },
  recommendationText: { color: '#D1FAE5', fontFamily: fontFamily.regular, fontSize: 12, marginTop: spacing.sm },
  error: { backgroundColor: '#FDECEC', borderRadius: radii.sm, color: colors.expense, fontFamily: fontFamily.medium, fontSize: 12, marginTop: spacing.md, padding: spacing.sm },
  primary: { alignItems: 'center', backgroundColor: colors.forest, borderRadius: radii.md, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', marginTop: 'auto', minHeight: 56, paddingHorizontal: spacing.md },
  primaryText: { color: colors.white, fontFamily: fontFamily.semiBold, fontSize: 15 },
  disabled: { opacity: 0.6 },
  footnote: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 11, lineHeight: 16, marginTop: spacing.sm, textAlign: 'center' },
  pressed: { opacity: 0.72 },
});
