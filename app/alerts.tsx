import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ArrowLeft } from 'lucide-react-native';
import { Screen } from '@/components/shared/Screen';
import { SqliteSettingsRepository } from '@/database/repositories/settings.repository';
import { type AlertPreferences, loadAlertPreferences } from '@/features/alerts/alert.service';
import { requestBudgetAlertPermission } from '@/features/alerts/notification.gateway';
import { settingKeys } from '@/lib/constants';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { radii, spacing } from '@/theme/spacing';

const preferenceKeys = { daily: settingKeys.alertDaily, monthly: settingKeys.alertMonthly, category: settingKeys.alertCategory, at80: settingKeys.alertAt80, at100: settingKeys.alertAt100 } as const;

export default function AlertSettingsScreen(): React.JSX.Element {
  const router = useRouter();
  const database = useSQLiteContext();
  const [preferences, setPreferences] = useState<AlertPreferences | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try { setPreferences(await loadAlertPreferences(new SqliteSettingsRepository(database))); }
    catch { setError('Alert settings could not be loaded.'); }
  }, [database]);
  useEffect(() => { void load(); }, [load]);

  const change = async (key: keyof AlertPreferences, value: boolean): Promise<void> => {
    if (!preferences || busy) return;
    setBusy(true); setError(null);
    try {
      if (value && (key === 'daily' || key === 'monthly' || key === 'category')) {
        if (!await requestBudgetAlertPermission()) { setError(Platform.OS === 'web' ? 'Device notifications are available on Android and iOS.' : 'Allow notifications in your device settings to enable budget alerts.'); return; }
      }
      await new SqliteSettingsRepository(database).set(preferenceKeys[key], String(value));
      setPreferences({ ...preferences, [key]: value });
    } catch { setError('Alert settings could not be saved.'); }
    finally { setBusy(false); }
  };

  return <Screen><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.header}><Pressable accessibilityLabel="Go back" accessibilityRole="button" onPress={() => router.back()} style={styles.back}><ArrowLeft color={colors.text} size={22} /></Pressable><Text style={styles.title}>Budget alerts</Text></View>
    <Text style={styles.subtitle}>Choose which spending limits should notify you after you record an expense. Alerts stay on this device.</Text>
    {!preferences ? <ActivityIndicator color={colors.forest} style={styles.loading} /> : <>
      <Text style={styles.section}>LIMITS</Text>
      <View style={styles.card}>
        <Option label="Daily limit" detail="Today’s spending" value={preferences.daily} disabled={busy} onChange={(value) => { void change('daily', value); }} />
        <Option label="Overall monthly budget" detail="Total spending this month" value={preferences.monthly} disabled={busy} onChange={(value) => { void change('monthly', value); }} />
        <Option label="Category budgets" detail="Each category with a monthly limit" value={preferences.category} disabled={busy} onChange={(value) => { void change('category', value); }} />
      </View>
      <Text style={styles.section}>WHEN TO ALERT</Text>
      <View style={styles.card}>
        <Option label="At 80%" detail="A heads-up before reaching a limit" value={preferences.at80} disabled={busy} onChange={(value) => { void change('at80', value); }} />
        <Option label="At 100%" detail="When a limit is reached or passed" value={preferences.at100} disabled={busy} onChange={(value) => { void change('at100', value); }} />
      </View>
      <Text style={styles.help}>Each threshold alerts once per day or budget month. If one entry crosses both, you’ll receive only the 100% alert. Notifications show no amounts on your lock screen.</Text>
    </>}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
  </ScrollView></Screen>;
}

function Option({ label, detail, value, disabled, onChange }: { label: string; detail: string; value: boolean; disabled: boolean; onChange: (value: boolean) => void }): React.JSX.Element {
  return <View style={styles.option}><View style={styles.copy}><Text style={styles.optionTitle}>{label}</Text><Text style={styles.optionDetail}>{detail}</Text></View><Switch accessibilityLabel={label} disabled={disabled} onValueChange={onChange} trackColor={{ false: colors.border, true: colors.forestSoft }} thumbColor={value ? colors.forest : colors.textMuted} value={value} /></View>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.screenHorizontal, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  header: { alignItems: 'center', flexDirection: 'row' }, back: { alignItems: 'center', justifyContent: 'center', height: 44, width: 44 },
  title: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 23, marginLeft: spacing.sm },
  subtitle: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 20, marginTop: spacing.md },
  section: { color: colors.textMuted, fontFamily: fontFamily.semiBold, fontSize: 11, letterSpacing: 1, marginTop: spacing.xl, marginBottom: spacing.sm },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, paddingHorizontal: spacing.md },
  option: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 72, gap: spacing.md },
  copy: { flex: 1 }, optionTitle: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 14 },
  optionDetail: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 17, marginTop: 2 },
  help: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 18, marginTop: spacing.lg },
  error: { color: colors.expense, fontFamily: fontFamily.medium, fontSize: 13, marginTop: spacing.md }, loading: { marginTop: spacing.xl },
});
