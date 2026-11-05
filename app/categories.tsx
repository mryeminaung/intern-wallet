import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ArrowLeft } from 'lucide-react-native';
import { Screen } from '../src/components/shared/Screen';
import { SqliteCategoryRepository } from '../src/database/repositories/category.repository';
import { CategoryService } from '../src/features/categories/services/category.service';
import type { Category, TransactionType } from '../src/types/common';
import { colors } from '../src/theme/colors';
import { fontFamily } from '../src/theme/typography';
import { radii, spacing } from '../src/theme/spacing';

export default function CategoriesScreen(): React.JSX.Element {
  const router = useRouter();
  const database = useSQLiteContext();
  const service = useMemo(() => new CategoryService(new SqliteCategoryRepository(database)), [database]);
  const [categories, setCategories] = useState<readonly Category[]>([]);
  const [type, setType] = useState<TransactionType>('expense');
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    try { setCategories(await service.list()); setError(null); }
    catch { setError('Categories could not be loaded.'); }
    finally { setLoading(false); }
  }, [service]);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  const resetForm = (): void => { setEditing(null); setName(''); setIcon(''); };
  const save = async (): Promise<void> => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await service.save({ name, icon, type }, editing?.id);
      resetForm();
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Category could not be saved.'); }
    finally { setSaving(false); }
  };
  const remove = (category: Category): void => {
    Alert.alert('Delete category?', `Delete ${category.name}? Categories used by transactions or budgets cannot be deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { void (async () => {
        try { await service.delete(category.id); if (editing?.id === category.id) resetForm(); await refresh(); }
        catch (cause) { setError(cause instanceof Error ? cause.message : 'Category could not be deleted.'); }
      })(); } },
    ]);
  };

  return <Screen><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}><ArrowLeft color={colors.text} size={22} /></Pressable><Text style={styles.title}>Categories</Text></View>
    <Text style={styles.subtitle}>Create your own income and expense categories. Built-in categories stay available.</Text>
    <View style={styles.tabs}>{(['expense', 'income'] as const).map((value) => <Pressable key={value} onPress={() => { setType(value); resetForm(); }} style={[styles.tab, type === value && styles.selected]}><Text style={[styles.tabText, type === value && styles.selectedText]}>{value === 'expense' ? 'Expenses' : 'Income'}</Text></Pressable>)}</View>
    <View style={styles.form}><Text style={styles.formTitle}>{editing ? `Edit ${editing.name}` : `New ${type} category`}</Text><View style={styles.inputs}><TextInput accessibilityLabel="Category icon" maxLength={8} onChangeText={setIcon} placeholder="Icon" placeholderTextColor={colors.textMuted} style={[styles.input, styles.iconInput]} value={icon} /><TextInput accessibilityLabel="Category name" maxLength={40} onChangeText={setName} placeholder="Name" placeholderTextColor={colors.textMuted} style={[styles.input, styles.nameInput]} value={name} /></View><View style={styles.actions}><Pressable disabled={saving} onPress={() => { void save(); }} style={styles.save}><Text style={styles.saveText}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Add category'}</Text></Pressable>{editing ? <Pressable onPress={resetForm} style={styles.cancel}><Text style={styles.cancelText}>Cancel</Text></Pressable> : null}</View></View>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    {loading ? <ActivityIndicator color={colors.forest} style={styles.loading} /> : null}
    {categories.filter((category) => category.type === type).map((category) => <View key={category.id} style={styles.row}><Text style={styles.rowIcon}>{category.icon}</Text><View style={styles.rowCopy}><Text style={styles.rowName}>{category.name}</Text><Text style={styles.rowDetail}>{category.isDefault ? 'Built-in' : 'Custom'}</Text></View>{!category.isDefault ? <View style={styles.rowActions}><Pressable accessibilityLabel={`Edit ${category.name}`} onPress={() => { setEditing(category); setName(category.name); setIcon(category.icon); }}><Text style={styles.edit}>Edit</Text></Pressable><Pressable accessibilityLabel={`Delete ${category.name}`} onPress={() => remove(category)}><Text style={styles.delete}>Delete</Text></Pressable></View> : null}</View>)}
  </ScrollView></Screen>;
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { alignItems: 'center', flexDirection: 'row' },
  back: { alignItems: 'center', height: 42, justifyContent: 'center', width: 42 },
  title: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 23, marginLeft: spacing.sm },
  subtitle: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 19, marginTop: spacing.sm },
  tabs: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  tab: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 99, flex: 1, padding: spacing.sm },
  selected: { backgroundColor: colors.forest },
  tabText: { color: colors.textMuted, fontFamily: fontFamily.medium },
  selectedText: { color: colors.white },
  form: { backgroundColor: colors.surface, borderRadius: radii.md, marginTop: spacing.lg, padding: spacing.md },
  formTitle: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 15 },
  inputs: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  input: { borderColor: colors.border, borderRadius: radii.sm, borderWidth: 1, color: colors.text, fontFamily: fontFamily.regular, minHeight: 48, paddingHorizontal: spacing.sm },
  iconInput: { width: 70 },
  nameInput: { flex: 1 },
  actions: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  save: { backgroundColor: colors.forest, borderRadius: radii.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  saveText: { color: colors.white, fontFamily: fontFamily.semiBold, fontSize: 13 },
  cancel: { padding: spacing.sm },
  cancelText: { color: colors.textMuted, fontFamily: fontFamily.medium },
  error: { color: colors.expense, fontFamily: fontFamily.medium, marginTop: spacing.md },
  loading: { marginTop: spacing.lg },
  row: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.sm, flexDirection: 'row', marginTop: spacing.sm, minHeight: 60, padding: spacing.sm },
  rowIcon: { fontSize: 22, width: 40 },
  rowCopy: { flex: 1 },
  rowName: { color: colors.text, fontFamily: fontFamily.medium, fontSize: 13 },
  rowDetail: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 11 },
  rowActions: { flexDirection: 'row', gap: spacing.md },
  edit: { color: colors.forest, fontFamily: fontFamily.medium },
  delete: { color: colors.expense, fontFamily: fontFamily.medium },
});
