import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ActivityIndicator, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ArrowLeft, CalendarDays } from 'lucide-react-native';
import { Screen } from '@/components/shared/Screen';
import { KeyboardAwareScrollView } from '@/components/shared/KeyboardAwareScrollView';
import { SqliteAnalyticsRepository } from '@/database/repositories/analytics.repository';
import { SqliteTransferRepository } from '@/database/repositories/transfer.repository';
import { TransferService } from './transfer.service';
import { formatDisplayDate } from '@/lib/date';
import { sourceLabel } from '@/lib/money-source';
import { formatMMK } from '@/lib/currency';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { radii, spacing } from '@/theme/spacing';
import { useUiStore } from '@/stores/ui.store';
import type { Transfer } from '@/types/common';

export function TransferEditor({ id }: { id?: string }): React.JSX.Element {
  const router = useRouter();
  const database = useSQLiteContext();
  const showNotice = useUiStore((state) => state.showNotice);
  const repo = useMemo(() => new SqliteTransferRepository(database), [database]);
  const service = useMemo(() => new TransferService(repo), [repo]);
  const [existing, setExisting] = useState<Transfer | null>(null);
  const [sourceBalances, setSourceBalances] = useState<readonly { key: string; balance: number }[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [otherBank, setOtherBank] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date());
  const [pickingDate, setPickingDate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [balances, transfer] = await Promise.all([new SqliteAnalyticsRepository(database).getSourceBalances(), id ? repo.getById(id) : Promise.resolve(null)]);
      setSourceBalances(balances);
      if (id && !transfer) throw new Error('This transfer could not be found.');
      if (transfer) {
        setExisting(transfer); setFrom(transfer.fromSourceKey); setTo(transfer.toSourceKey);
        setAmount(String(transfer.amount)); setNote(transfer.note ?? ''); setDate(new Date(transfer.date));
      } else {
        setFrom(balances.find((row) => row.balance > 0)?.key ?? 'cash');
        setTo('');
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Sources could not be loaded.'); }
    finally { setLoading(false); }
  }, [database, id, repo]);
  useEffect(() => { void load(); }, [load]);

  const sourceOptions = useMemo(() => {
    const keys = new Set(['cash', ...sourceBalances.map((row) => row.key), ...(existing ? [existing.fromSourceKey, existing.toSourceKey] : [])]);
    return [...keys].filter((key) => key !== 'unspecified' || key === existing?.fromSourceKey || sourceBalances.some((row) => row.key === key && row.balance !== 0));
  }, [existing, sourceBalances]);
  const destination = to === 'other-bank' ? `bank:${otherBank.trim()}` : to;
  const fromBalance = (sourceBalances.find((row) => row.key === from)?.balance ?? 0) + (existing?.fromSourceKey === from ? existing.amount : 0);

  const save = async (): Promise<void> => {
    Keyboard.dismiss(); setError(null);
    const numericAmount = Number(amount);
    if (!Number.isSafeInteger(numericAmount) || numericAmount <= 0) { setError('Enter a positive whole-number amount.'); return; }
    if (to === 'other-bank' && !otherBank.trim()) { setError('Enter a bank name.'); return; }
    setSaving(true);
    try {
      const input = { fromSourceKey: from, toSourceKey: destination, amount: numericAmount, note: note.trim() || null, date: date.toISOString() };
      if (existing) await service.update(existing.id, input); else await service.create(input);
      showNotice(existing ? 'Transfer updated' : 'Transfer saved');
      router.back();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Transfer could not be saved.'); }
    finally { setSaving(false); }
  };

  const remove = (): void => {
    if (!existing) return;
    Alert.alert('Delete transfer?', 'The money will return to its original source.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { void service.delete(existing.id).then(() => { showNotice('Transfer deleted'); router.back(); }).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Transfer could not be deleted.')); } },
    ]);
  };

  return <Screen><KeyboardAwareScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><Pressable accessibilityLabel="Go back" accessibilityRole="button" onPress={() => router.back()} style={styles.back}><ArrowLeft color={colors.text} size={22} /></Pressable><Text style={styles.title}>{existing ? 'Edit transfer' : 'Transfer money'}</Text></View>
    <Text style={styles.subtitle}>Move money between sources. Transfers do not change income, spending, or budgets.</Text>
    {loading ? <ActivityIndicator color={colors.forest} style={styles.loading} /> : id && !existing ? <Text style={styles.error}>{error ?? 'Transfer not found.'}</Text> : <>
      <Text style={styles.label}>From</Text>
      <View style={styles.chips}>{sourceOptions.map((key) => <Pressable accessibilityRole="button" accessibilityState={{ selected: from === key }} key={key} onPress={() => setFrom(key)} style={[styles.chip, from === key && styles.selected]}><Text style={[styles.chipText, from === key && styles.selectedText]}>{sourceLabel(key)} · {formatMMK(sourceBalances.find((row) => row.key === key)?.balance ?? 0)}</Text></Pressable>)}</View>
      <Text style={styles.label}>To</Text>
      <View style={styles.chips}>{sourceOptions.filter((key) => key !== 'unspecified').map((key) => <Pressable accessibilityRole="button" accessibilityState={{ selected: to === key }} key={key} onPress={() => setTo(key)} style={[styles.chip, to === key && styles.selected]}><Text style={[styles.chipText, to === key && styles.selectedText]}>{sourceLabel(key)}</Text></Pressable>)}<Pressable accessibilityRole="button" accessibilityState={{ selected: to === 'other-bank' }} onPress={() => setTo('other-bank')} style={[styles.chip, to === 'other-bank' && styles.selected]}><Text style={[styles.chipText, to === 'other-bank' && styles.selectedText]}>New bank</Text></Pressable></View>
      {to === 'other-bank' ? <TextInput accessibilityLabel="New bank name" autoCapitalize="characters" maxLength={40} onChangeText={setOtherBank} placeholder="Bank name" placeholderTextColor={colors.textMuted} style={styles.input} value={otherBank} /> : null}
      <Text style={styles.label}>Amount · MMK</Text><TextInput accessibilityLabel="Transfer amount in MMK" keyboardType="number-pad" onChangeText={setAmount} placeholder="0" placeholderTextColor={colors.textMuted} style={styles.input} value={amount} />
      {Number(amount) > fromBalance && from ? <Text style={styles.warning}>This exceeds the recorded {sourceLabel(from)} balance. Check that all income and expenses for this source are entered.</Text> : null}
      <Text style={styles.label}>Date</Text><Pressable accessibilityRole="button" onPress={() => setPickingDate(true)} style={styles.date}><CalendarDays color={colors.forest} size={18} /><Text style={styles.dateText}>{formatDisplayDate(date.toISOString())}</Text></Pressable>
      <Text style={styles.label}>Note (optional)</Text><TextInput accessibilityLabel="Transfer note" maxLength={250} onChangeText={setNote} placeholder="What was this transfer for?" placeholderTextColor={colors.textMuted} style={styles.input} value={note} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable accessibilityRole="button" disabled={saving} onPress={() => { void save(); }} style={styles.save}>{saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveText}>Save transfer</Text>}</Pressable>
      {existing ? <Pressable accessibilityRole="button" onPress={remove} style={styles.delete}><Text style={styles.deleteText}>Delete transfer</Text></Pressable> : null}
    </>}
    {pickingDate ? <DateTimePicker mode="date" onDismiss={() => setPickingDate(false)} onValueChange={(_event, value) => { setPickingDate(false); if (value) setDate(value); }} value={date} /> : null}
  </KeyboardAwareScrollView></Screen>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.screenHorizontal, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  header: { alignItems: 'center', flexDirection: 'row' }, back: { alignItems: 'center', justifyContent: 'center', height: 44, width: 44 },
  title: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 22, marginLeft: spacing.sm },
  subtitle: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 19, marginTop: spacing.sm },
  label: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 14, marginTop: spacing.lg, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { borderColor: colors.border, borderRadius: 99, borderWidth: 1, minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.md },
  selected: { backgroundColor: colors.forest, borderColor: colors.forest },
  chipText: { color: colors.text, fontFamily: fontFamily.medium, fontSize: 12 }, selectedText: { color: colors.white },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.sm, borderWidth: 1, color: colors.text, fontFamily: fontFamily.medium, fontSize: 16, minHeight: 50, paddingHorizontal: spacing.md },
  date: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.sm, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, minHeight: 50, paddingHorizontal: spacing.md },
  dateText: { color: colors.text, fontFamily: fontFamily.medium, fontSize: 14 },
  warning: { color: colors.warning, fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 18, marginTop: spacing.sm },
  error: { color: colors.expense, fontFamily: fontFamily.medium, fontSize: 13, marginTop: spacing.md },
  save: { alignItems: 'center', backgroundColor: colors.forest, borderRadius: radii.sm, justifyContent: 'center', minHeight: 52, marginTop: spacing.xl },
  saveText: { color: colors.white, fontFamily: fontFamily.semiBold, fontSize: 15 },
  delete: { alignItems: 'center', minHeight: 48, justifyContent: 'center', marginTop: spacing.md },
  deleteText: { color: colors.expense, fontFamily: fontFamily.medium, fontSize: 14 }, loading: { marginTop: spacing.xl },
});
