import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ArrowLeft } from 'lucide-react-native';
import { Screen } from '../src/components/shared/Screen';
import { DataManagementRepository } from '../src/database/repositories/data-management.repository';
import { DataManagementService } from '../src/features/data-management/services/data-management.service';
import { colors } from '../src/theme/colors';
import { fontFamily } from '../src/theme/typography';
import { radii, spacing } from '../src/theme/spacing';

export default function DataManagementScreen(): React.JSX.Element {
  const router = useRouter();
  const database = useSQLiteContext();
  const service = useMemo(() => new DataManagementService(new DataManagementRepository(database)), [database]);
  const [backupText, setBackupText] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const share = async (kind: 'csv' | 'backup'): Promise<void> => {
    if (busy) return;
    setBusy(true); setError(null); setMessage(null);
    try {
      const content = kind === 'csv' ? await service.exportCsv() : await service.createBackup();
      await Share.share({ message: content, title: kind === 'csv' ? 'Intern Wallet CSV' : 'Intern Wallet JSON backup' });
      setMessage(kind === 'csv' ? 'CSV text is ready to save from the share sheet.' : 'Keep your JSON backup in a safe place.');
    } catch { setError('The data could not be shared. Please try again.'); }
    finally { setBusy(false); }
  };
  const previewRestore = (): void => {
    setError(null); setMessage(null);
    try {
      const preview = service.previewBackup(backupText);
      Alert.alert('Replace all wallet data?', `Backup from ${new Date(preview.createdAt).toLocaleString()} contains ${preview.transactions} transactions, ${preview.categories} categories, ${preview.budgets} budgets, and ${preview.settings} settings. Existing wallet data will be replaced.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Replace data', style: 'destructive', onPress: () => { void restore(backupText); } },
      ]);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Backup could not be read.'); }
  };
  const restore = async (json: string): Promise<void> => {
    if (busy) return;
    setBusy(true); setError(null); setMessage(null);
    try { await service.restoreBackup(json); setBackupText(''); setMessage('Backup restored. Reopen Home to see the restored figures.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Restore failed. Your current data was not changed.'); }
    finally { setBusy(false); }
  };

  return <Screen><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}><ArrowLeft color={colors.text} size={22} /></Pressable><Text style={styles.title}>Data management</Text></View>
    <Text style={styles.subtitle}>Your data stays on this device unless you choose to share it.</Text>
    <View style={styles.card}><Text style={styles.heading}>CSV transactions</Text><Text style={styles.help}>Share income and expense rows with date, type, category, amount in MMK, and note.</Text><Action label="Share CSV text" disabled={busy} onPress={() => { void share('csv'); }} /></View>
    <View style={styles.card}><Text style={styles.heading}>JSON backup</Text><Text style={styles.help}>Includes transactions, categories, monthly budgets, daily limit, internship dates, and app settings.</Text><Action label="Share JSON backup text" disabled={busy} onPress={() => { void share('backup'); }} /></View>
    <View style={styles.card}><Text style={styles.heading}>Restore backup</Text><Text style={styles.help}>Paste a previously shared Intern Wallet JSON backup. You can inspect its counts before confirming replacement.</Text><TextInput accessibilityLabel="Paste JSON backup" multiline onChangeText={setBackupText} placeholder="Paste backup JSON here" placeholderTextColor={colors.textMuted} style={styles.input} textAlignVertical="top" value={backupText} /><Action label="Review and restore" disabled={busy || !backupText.trim()} onPress={previewRestore} /></View>
    {busy ? <ActivityIndicator color={colors.forest} style={styles.status} /> : null}
    {message ? <Text style={styles.success}>{message}</Text> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <Text style={styles.footnote}>Sharing uses Android’s text share sheet. This version cannot create or open standalone files yet.</Text>
  </ScrollView></Screen>;
}

function Action({ label, disabled, onPress }: { label: string; disabled: boolean; onPress: () => void }): React.JSX.Element {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.action, disabled && styles.disabled]}><Text style={styles.actionText}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { alignItems: 'center', flexDirection: 'row' },
  back: { alignItems: 'center', height: 42, justifyContent: 'center', width: 42 },
  title: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 23, marginLeft: spacing.sm },
  subtitle: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 13, marginTop: spacing.sm },
  card: { backgroundColor: colors.surface, borderRadius: radii.md, marginTop: spacing.lg, padding: spacing.md },
  heading: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 17 },
  help: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 19, marginTop: spacing.xs },
  action: { alignItems: 'center', backgroundColor: colors.forest, borderRadius: radii.sm, marginTop: spacing.md, minHeight: 48, justifyContent: 'center' },
  disabled: { opacity: 0.5 },
  actionText: { color: colors.white, fontFamily: fontFamily.semiBold, fontSize: 13 },
  input: { borderColor: colors.border, borderRadius: radii.sm, borderWidth: 1, color: colors.text, fontFamily: fontFamily.regular, marginTop: spacing.md, minHeight: 110, padding: spacing.sm },
  status: { marginTop: spacing.md },
  success: { color: colors.income, fontFamily: fontFamily.medium, marginTop: spacing.md },
  error: { color: colors.expense, fontFamily: fontFamily.medium, marginTop: spacing.md },
  footnote: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 11, lineHeight: 16, marginTop: spacing.lg },
});
