import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ArrowLeft } from 'lucide-react-native';
import { Screen } from '../src/components/shared/Screen';
import { DataManagementRepository } from '../src/database/repositories/data-management.repository';
import { pickBackupFile, shareDataFile } from '../src/features/data-management/services/data-file.service';
import type { BackupPreview } from '../src/features/data-management/services/data-management.service';
import { DataManagementService } from '../src/features/data-management/services/data-management.service';
import { colors } from '../src/theme/colors';
import { fontFamily } from '../src/theme/typography';
import { radii, spacing } from '../src/theme/spacing';

export default function DataManagementScreen(): React.JSX.Element {
  const router = useRouter();
  const database = useSQLiteContext();
  const service = useMemo(() => new DataManagementService(new DataManagementRepository(database)), [database]);
  const [selectedBackup, setSelectedBackup] = useState<{ name: string; content: string; preview: BackupPreview } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const exportFile = async (kind: 'csv' | 'backup'): Promise<void> => {
    if (busy) return;
    setBusy(true); setError(null); setMessage(null);
    try {
      const content = kind === 'csv' ? await service.exportCsv() : await service.createBackup();
      const fileName = await shareDataFile(content, kind);
      setMessage(`${fileName} is ready in the share sheet.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'The file could not be exported. Please try again.'); }
    finally { setBusy(false); }
  };

  const chooseBackup = async (): Promise<void> => {
    if (busy) return;
    setBusy(true); setError(null); setMessage(null);
    try {
      const picked = await pickBackupFile();
      if (!picked) return;
      const preview = service.previewBackup(picked.content);
      setSelectedBackup({ ...picked, preview });
    } catch (cause) {
      setSelectedBackup(null);
      setError(cause instanceof Error ? cause.message : 'The backup file could not be read.');
    } finally { setBusy(false); }
  };

  const confirmRestore = (): void => {
    if (!selectedBackup) return;
    setError(null); setMessage(null);
    const { content, preview } = selectedBackup;
    Alert.alert('Replace all wallet data?', `Backup from ${new Date(preview.createdAt).toLocaleString()} contains ${preview.transactions} transactions, ${preview.categories} categories, ${preview.budgets} budgets, and ${preview.settings} settings. Existing wallet data will be replaced.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Replace data', style: 'destructive', onPress: () => { void restore(content); } },
    ]);
  };

  const restore = async (json: string): Promise<void> => {
    if (busy) return;
    setBusy(true); setError(null); setMessage(null);
    try { await service.restoreBackup(json); setSelectedBackup(null); setMessage('Backup restored. Reopen Home to see the restored figures.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Restore failed. Your current data was not changed.'); }
    finally { setBusy(false); }
  };

  return <Screen><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
    <View style={styles.header}><Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}><ArrowLeft color={colors.text} size={22} /></Pressable><Text style={styles.title}>Data management</Text></View>
    <Text style={styles.subtitle}>Your data stays on this device unless you choose to share it.</Text>
    <View style={styles.card}><Text style={styles.heading}>CSV transactions</Text><Text style={styles.help}>Export income and expense rows with date, type, category, amount in MMK, and note.</Text><Action label="Export CSV file" disabled={busy} onPress={() => { void exportFile('csv'); }} /></View>
    <View style={styles.card}><Text style={styles.heading}>JSON backup</Text><Text style={styles.help}>Export transactions, categories, monthly budgets, daily limit, internship dates, and app settings.</Text><Action label="Export JSON backup" disabled={busy} onPress={() => { void exportFile('backup'); }} /></View>
    <View style={styles.card}>
      <Text style={styles.heading}>Restore backup</Text>
      <Text style={styles.help}>Choose an Intern Wallet JSON backup. Its contents are validated before you can replace your current data.</Text>
      <Action label="Choose JSON backup file" disabled={busy} onPress={() => { void chooseBackup(); }} />
      {selectedBackup ? <View style={styles.filePreview}>
        <Text numberOfLines={1} style={styles.fileName}>{selectedBackup.name}</Text>
        <Text style={styles.fileDetails}>Created {new Date(selectedBackup.preview.createdAt).toLocaleString()}</Text>
        <Text style={styles.fileDetails}>{selectedBackup.preview.transactions} transactions · {selectedBackup.preview.categories} categories · {selectedBackup.preview.budgets} budgets</Text>
        <Action label="Restore selected backup" disabled={busy} onPress={confirmRestore} />
      </View> : null}
    </View>
    {busy ? <ActivityIndicator color={colors.forest} style={styles.status} /> : null}
    {message ? <Text style={styles.success}>{message}</Text> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <Text style={styles.footnote}>Exports are real files opened in your system share/save sheet. Keep JSON backups in a safe place.</Text>
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
  filePreview: { borderColor: colors.border, borderRadius: radii.sm, borderWidth: 1, marginTop: spacing.md, padding: spacing.md },
  fileName: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 13 },
  fileDetails: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 18, marginTop: spacing.xs },
  status: { marginTop: spacing.md },
  success: { color: colors.income, fontFamily: fontFamily.medium, marginTop: spacing.md },
  error: { color: colors.expense, fontFamily: fontFamily.medium, marginTop: spacing.md },
  footnote: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 11, lineHeight: 16, marginTop: spacing.lg },
});
