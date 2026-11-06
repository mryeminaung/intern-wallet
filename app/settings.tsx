import Constants from 'expo-constants';
import { ArrowDownLeft, ArrowLeft, ChevronRight, CloudOff, Database, Info, Palette, ShieldCheck, Tags, WalletCards, type LucideIcon } from 'lucide-react-native';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../src/components/shared/Screen';
import { APP_NAME } from '../src/lib/constants';
import { colors } from '../src/theme/colors';
import { fontFamily } from '../src/theme/typography';
import { radii, shadows, spacing } from '../src/theme/spacing';
import { useTransactionFilterStore } from '../src/stores/transaction-filter.store';

const appVersion = Constants.expoConfig?.version ?? '1.0.0';

export default function SettingsScreen(): React.JSX.Element {
  const router = useRouter();
  const setTransactionType = useTransactionFilterStore((state) => state.setType);
  const setTransactionCategory = useTransactionFilterStore((state) => state.setCategoryId);
  return <Screen><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.header}><Pressable accessibilityLabel="Go back" accessibilityRole="button" onPress={() => router.back()} style={styles.back}><ArrowLeft color={colors.text} size={22} /></Pressable><View><Text style={styles.eyebrow}>YOUR WALLET</Text><Text style={styles.title}>Settings</Text></View></View>

    <View style={styles.identityCard}><Image accessibilityIgnoresInvertColors source={require('../assets/icon.png')} style={styles.identityLogo} /><View style={styles.identityCopy}><Text style={styles.identityTitle}>{APP_NAME}</Text><Text style={styles.identityText}>Private, offline-first money tracking.</Text></View></View>

    <SettingsSection title="Manage your money">
      <SettingsLink icon={ArrowDownLeft} label="Income history" value="View transactions filtered to income" onPress={() => { setTransactionType('income'); setTransactionCategory(null); router.push('/transactions'); }} />
      <SettingsLink icon={Tags} label="Categories" value="Manage income and expense categories" onPress={() => router.push('/categories')} />
    </SettingsSection>

    <SettingsSection title="Data & storage">
      <SettingsLink icon={Database} label="Data management" value="Export CSV, back up, or restore your wallet" onPress={() => router.push('/data-management')} />
      <SettingsRow icon={CloudOff} label="Offline mode" value="No account or cloud sync" />
    </SettingsSection>

    <SettingsSection title="App preferences">
      <SettingsRow icon={WalletCards} label="Currency" value="Myanmar Kyat (MMK)" />
      <SettingsRow icon={Info} label="Date format" value="Long date format" />
      <SettingsRow icon={Palette} label="Appearance" value="Light theme" />
    </SettingsSection>

    <SettingsSection title="About">
      <SettingsRow icon={ShieldCheck} label="Privacy" value="Financial records stay on this device" />
      <SettingsRow icon={Info} label="About Intern Wallet" value={`Version ${appVersion}`} />
    </SettingsSection>
  </ScrollView></Screen>;
}

type SettingsRowProps = { icon: LucideIcon; label: string; value: string };

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }): React.JSX.Element {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text><View style={styles.card}>{children}</View></View>;
}

function SettingsRow({ icon: Icon, label, value }: SettingsRowProps): React.JSX.Element {
  return <View style={styles.row}><View style={styles.rowIcon}><Icon color={colors.forest} size={19} strokeWidth={2.1} /></View><View style={styles.rowCopy}><Text style={styles.rowLabel}>{label}</Text><Text style={styles.rowValue}>{value}</Text></View></View>;
}

function SettingsLink({ icon: Icon, label, value, onPress }: SettingsRowProps & { onPress: () => void }): React.JSX.Element {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}><View style={styles.rowIcon}><Icon color={colors.forest} size={19} strokeWidth={2.1} /></View><View style={styles.rowCopy}><Text style={styles.rowLabel}>{label}</Text><Text style={styles.rowValue}>{value}</Text></View><ChevronRight color={colors.textMuted} size={18} /></Pressable>;
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  back: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 99, height: 44, justifyContent: 'center', width: 44 },
  eyebrow: { color: colors.income, fontFamily: fontFamily.semiBold, fontSize: 10, letterSpacing: 1.2 },
  title: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 28, marginTop: 2 },
  identityCard: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: radii.lg, flexDirection: 'row', marginTop: spacing.xl, padding: spacing.md },
  identityLogo: { borderRadius: radii.md, height: 52, width: 52 },
  identityCopy: { flex: 1, marginLeft: spacing.md },
  identityTitle: { color: colors.forest, fontFamily: fontFamily.bold, fontSize: 17 },
  identityText: { color: colors.forestDark, fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 18, marginTop: spacing.xs },
  section: { marginTop: spacing.xl },
  sectionTitle: { color: colors.textMuted, fontFamily: fontFamily.medium, fontSize: 12, letterSpacing: 0.4, marginBottom: spacing.sm, textTransform: 'uppercase' },
  card: { backgroundColor: colors.surface, borderRadius: radii.md, paddingHorizontal: spacing.md, ...shadows.soft },
  row: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 72, paddingVertical: spacing.sm },
  pressed: { opacity: 0.72 },
  rowIcon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: radii.sm, height: 38, justifyContent: 'center', marginRight: spacing.sm, width: 38 },
  rowCopy: { flex: 1, minWidth: 0 },
  rowLabel: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 14 },
  rowValue: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 18, marginTop: 3 },
});
