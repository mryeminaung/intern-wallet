import { useCallback, useMemo, useRef, useState, type ComponentRef, type RefObject } from 'react';
import { ActivityIndicator, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ArrowLeft, ImagePlus, Trash2 } from 'lucide-react-native';
import { Screen } from '../src/components/shared/Screen';
import { KeyboardAwareScrollView } from '../src/components/shared/KeyboardAwareScrollView';
import { SqliteSettingsRepository } from '../src/database/repositories/settings.repository';
import { ProfileAvatar } from '../src/features/profile/components/profile-avatar';
import { chooseProfileImage, deleteOwnedProfileImage, persistProfileImage } from '../src/features/profile/services/profile-image.service';
import { ProfileService } from '../src/features/profile/services/profile.service';
import { useUiStore } from '../src/stores/ui.store';
import { colors } from '../src/theme/colors';
import { fontFamily } from '../src/theme/typography';
import { radii, shadows, spacing } from '../src/theme/spacing';

export default function ProfileScreen(): React.JSX.Element {
  const router = useRouter();
  const database = useSQLiteContext();
  const service = useMemo(() => new ProfileService(new SqliteSettingsRepository(database)), [database]);
  const showNotice = useUiStore((state) => state.showNotice);
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('');
  const [organization, setOrganization] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [savedAvatarUri, setSavedAvatarUri] = useState<string | null>(null);
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const roleInputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const organizationInputRef = useRef<ComponentRef<typeof TextInput>>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const profile = await service.get();
      setDisplayName(profile.displayName); setRole(profile.role); setOrganization(profile.organization);
      setAvatarUri(profile.avatarUri); setSavedAvatarUri(profile.avatarUri); setAvatarChanged(false);
    } catch { setError('Your profile could not be loaded.'); }
    finally { setLoading(false); }
  }, [service]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const changePhoto = async (): Promise<void> => {
    setError(null);
    try {
      const uri = await chooseProfileImage();
      if (uri) { setAvatarUri(uri); setAvatarChanged(true); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'The photo could not be selected.'); }
  };

  const save = async (): Promise<void> => {
    if (saving) return;
    Keyboard.dismiss();
    setSaving(true); setError(null);
    let persistedAvatar: string | null = null;
    try {
      if (avatarChanged && avatarUri) persistedAvatar = await persistProfileImage(avatarUri);
      const finalAvatar = avatarChanged ? persistedAvatar : savedAvatarUri;
      await service.save({ avatarUri: finalAvatar, displayName, organization, role });
      if (avatarChanged && savedAvatarUri !== finalAvatar) deleteOwnedProfileImage(savedAvatarUri);
      showNotice('Profile updated');
      router.back();
    } catch (cause) {
      if (persistedAvatar) deleteOwnedProfileImage(persistedAvatar);
      setError(cause instanceof Error ? cause.message : 'Your profile could not be saved.');
    } finally { setSaving(false); }
  };

  return <Screen><KeyboardAwareScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><Pressable accessibilityLabel="Go back" accessibilityRole="button" onPress={() => router.back()} style={styles.back}><ArrowLeft color={colors.text} size={22} /></Pressable><Text style={styles.title}>Edit profile</Text><View style={styles.headerSpacer} /></View>
    <Text style={styles.subtitle}>Make Intern Wallet feel like yours. Your profile stays on this device.</Text>
    {loading ? <ActivityIndicator color={colors.forest} style={styles.loading} /> : <>
      <View style={styles.photoCard}>
        <ProfileAvatar avatarUri={avatarUri} displayName={displayName} size={104} />
        <View style={styles.photoActions}><Pressable accessibilityRole="button" onPress={() => { void changePhoto(); }} style={({ pressed }) => [styles.photoButton, pressed && styles.pressed]}><ImagePlus color={colors.forest} size={18} /><Text style={styles.photoButtonText}>{avatarUri ? 'Change photo' : 'Choose photo'}</Text></Pressable>{avatarUri ? <Pressable accessibilityRole="button" onPress={() => { setAvatarUri(null); setAvatarChanged(true); }} style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}><Trash2 color={colors.expense} size={16} /><Text style={styles.removeText}>Remove</Text></Pressable> : null}</View>
      </View>
      <View style={styles.form}>
        <Field label="Display name" maxLength={40} onChangeText={setDisplayName} onSubmitEditing={() => roleInputRef.current?.focus()} placeholder="For example, May" value={displayName} />
        <Field inputRef={roleInputRef} label="Internship role" maxLength={60} onChangeText={setRole} onSubmitEditing={() => organizationInputRef.current?.focus()} optional placeholder="For example, UI/UX Design Intern" value={role} />
        <Field inputRef={organizationInputRef} label="Organization" maxLength={60} onChangeText={setOrganization} onSubmitEditing={Keyboard.dismiss} optional placeholder="Company or school" returnKeyType="done" value={organization} />
        <Text style={styles.help}>Your name appears in the Home greeting. Text details are included in JSON backups; the local photo is not.</Text>
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <Pressable accessibilityRole="button" disabled={saving} onPress={() => { void save(); }} style={[styles.save, saving && styles.disabled]}>{saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveText}>Save profile</Text>}</Pressable>
      </View>
    </>}
  </KeyboardAwareScrollView></Screen>;
}

function Field({ inputRef, label, maxLength, onChangeText, onSubmitEditing, optional = false, placeholder, returnKeyType = 'next', value }: { inputRef?: RefObject<ComponentRef<typeof TextInput> | null>; label: string; maxLength: number; onChangeText: (value: string) => void; onSubmitEditing: () => void; optional?: boolean; placeholder: string; returnKeyType?: 'done' | 'next'; value: string }): React.JSX.Element {
  return <View style={styles.field}><View style={styles.labelRow}><Text style={styles.label}>{label}</Text>{optional ? <Text style={styles.optional}>Optional</Text> : null}</View><TextInput ref={inputRef} accessibilityLabel={label} autoCapitalize="words" blurOnSubmit={returnKeyType === 'done'} maxLength={maxLength} onChangeText={onChangeText} onSubmitEditing={onSubmitEditing} placeholder={placeholder} placeholderTextColor={colors.textMuted} returnKeyType={returnKeyType} style={styles.input} value={value} /></View>;
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { alignItems: 'center', flexDirection: 'row' },
  back: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 99, height: 44, justifyContent: 'center', width: 44 },
  headerSpacer: { width: 44 },
  title: { color: colors.text, flex: 1, fontFamily: fontFamily.bold, fontSize: 22, textAlign: 'center' },
  subtitle: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 21, marginTop: spacing.md, textAlign: 'center' },
  loading: { marginTop: spacing.xl },
  photoCard: { alignItems: 'center', marginTop: spacing.xl },
  photoActions: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  photoButton: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: 99, flexDirection: 'row', gap: spacing.sm, minHeight: 44, paddingHorizontal: spacing.md },
  photoButtonText: { color: colors.forest, fontFamily: fontFamily.semiBold, fontSize: 13 },
  removeButton: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, minHeight: 44, paddingHorizontal: spacing.sm },
  removeText: { color: colors.expense, fontFamily: fontFamily.semiBold, fontSize: 13 },
  pressed: { opacity: 0.7 },
  form: { backgroundColor: colors.surface, borderRadius: radii.lg, marginTop: spacing.xl, padding: spacing.lg, ...shadows.soft },
  field: { marginBottom: spacing.lg },
  labelRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  label: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 13 },
  optional: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 11 },
  input: { borderColor: colors.border, borderRadius: radii.sm, borderWidth: 1, color: colors.text, fontFamily: fontFamily.regular, fontSize: 15, minHeight: 52, paddingHorizontal: spacing.md },
  help: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 18 },
  error: { backgroundColor: '#FDECEC', borderRadius: radii.sm, color: colors.expense, fontFamily: fontFamily.regular, fontSize: 12, marginTop: spacing.md, padding: spacing.sm },
  save: { alignItems: 'center', backgroundColor: colors.forest, borderRadius: radii.md, justifyContent: 'center', marginTop: spacing.xl, minHeight: 54 },
  disabled: { opacity: 0.65 },
  saveText: { color: colors.white, fontFamily: fontFamily.semiBold, fontSize: 15 },
});
