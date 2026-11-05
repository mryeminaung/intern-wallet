import Constants from 'expo-constants';
import { CloudOff, Database, Info, Palette, ShieldCheck, Target, WalletCards, ChevronRight, CalendarDays, Tags, ArrowDownLeft } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/shared/Screen';
import { APP_NAME } from '../../src/lib/constants';
import { colors } from '../../src/theme/colors';
import { fontFamily } from '../../src/theme/typography';
import { radii, shadows, spacing } from '../../src/theme/spacing';
import { useTransactionFilterStore } from '../../src/stores/transaction-filter.store';

const appVersion = Constants.expoConfig?.version ?? '1.0.0';

export default function SettingsScreen(): React.JSX.Element {
  const router = useRouter();
  const setTransactionType = useTransactionFilterStore((state) => state.setType);
  const setTransactionCategory = useTransactionFilterStore((state) => state.setCategoryId);
  return <Screen><ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.eyebrow}>YOUR WALLET</Text>
    <Text style={styles.title}>Settings</Text>
    <Text style={styles.subtitle}>Customize your Intern Wallet experience.</Text>

    <View style={styles.identityCard}><View style={styles.identityIcon}><WalletCards color={colors.forest} size={25} /></View><View style={styles.identityCopy}><Text style={styles.identityTitle}>{APP_NAME}</Text><Text style={styles.identityText}>Your private, offline-first money companion.</Text></View></View>

    <SettingsSection title="Preferences">
      <SettingsRow icon={WalletCards} label="Currency" value="Myanmar Kyat (MMK) · the supported currency" />
      <SettingsRow icon={Info} label="Date format" value="Long date format" />
      <SettingsRow icon={Palette} label="Appearance" value="Light theme" />
    </SettingsSection>

    <SettingsSection title="Data & storage">
      <SettingsRow icon={Database} label="Local storage" value="SQLite database on this device" />
      <SettingsRow icon={CloudOff} label="Offline mode" value="No account or cloud sync" />
    </SettingsSection>

    <SettingsSection title="Budget preferences">
      <SettingsLink icon={Target} label="Daily budget and internship dates" value="Set your daily limit and progress dates" onPress={() => router.push('/daily-budget')} />
      <SettingsLink icon={CalendarDays} label="Daily spending history" value="Review each day against its limit" onPress={() => router.push('/daily-history')} />
    </SettingsSection>

    <SettingsSection title="Manage your money">
      <SettingsLink icon={ArrowDownLeft} label="Income history" value="Filter your transactions to income" onPress={() => { setTransactionType('income'); setTransactionCategory(null); router.push('/transactions'); }} />
      <SettingsLink icon={Tags} label="Categories" value="Manage custom income and expense categories" onPress={() => router.push('/categories')} />
    </SettingsSection>

    <SettingsSection title="About">
      <SettingsRow icon={ShieldCheck} label="Privacy & data" value="Your financial records stay on this device" />
      <SettingsRow icon={Info} label="About Intern Wallet" value={`Version ${appVersion}`} />
    </SettingsSection>

    <View style={styles.footer}><Text style={styles.footerTitle}>{APP_NAME}</Text><Text style={styles.footerText}>Made for better money management.</Text></View>
  </ScrollView></Screen>;
}

type SettingsRowProps = { icon: typeof WalletCards; label: string; value: string };

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
  eyebrow: { color: colors.income, fontFamily: fontFamily.semiBold, fontSize: 11, letterSpacing: 1.3, marginTop: spacing.sm },
  title: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 30, marginTop: spacing.xs },
  subtitle: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 15, lineHeight: 22, marginTop: spacing.xs },
  identityCard: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: radii.lg, flexDirection: 'row', marginTop: spacing.xl, padding: spacing.md },
  identityIcon: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.md, height: 52, justifyContent: 'center', width: 52 },
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
  footer: { paddingTop: spacing.xl },
  footerTitle: { color: colors.forest, fontFamily: fontFamily.semiBold, fontSize: 14, textAlign: 'center' },
  footerText: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 12, marginTop: spacing.xs, textAlign: 'center' },
});
