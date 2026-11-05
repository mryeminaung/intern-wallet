import { Pencil, Trash2 } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatMMK } from '../../../lib/currency';
import { colors } from '../../../theme/colors';
import { radii, shadows, spacing } from '../../../theme/spacing';
import { fontFamily } from '../../../theme/typography';
import type { BudgetProgress } from '../../../types/common';
import { BudgetProgress as BudgetProgressBar } from './budget-progress';

type BudgetCardProps = {
  budget: BudgetProgress;
  onEdit: () => void;
  onDelete: () => void;
};

const statusLabels = {
  normal: 'Normal',
  approaching: 'Approaching limit',
  'almost-exhausted': 'Almost exhausted',
  exceeded: 'Exceeded',
} as const;

export function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps): React.JSX.Element {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text style={styles.icon}>{budget.category?.icon ?? '◉'}</Text>
          <View>
            <Text style={styles.title}>{budget.category?.name ?? 'Overall budget'}</Text>
            <Text style={styles.status}>{statusLabels[budget.status]}</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <Pressable accessibilityLabel="Edit budget" onPress={onEdit} style={styles.action}><Pencil color={colors.forest} size={17} /></Pressable>
          <Pressable accessibilityLabel="Delete budget" onPress={onDelete} style={styles.action}><Trash2 color={colors.expense} size={17} /></Pressable>
        </View>
      </View>
      <View style={styles.amountRow}>
        <Text style={styles.spent}>{formatMMK(budget.spent)} <Text style={styles.muted}>spent</Text></Text>
        <Text style={styles.limit}>{formatMMK(budget.amount)}</Text>
      </View>
      <BudgetProgressBar percentage={budget.usagePercentage} status={budget.status} />
      <Text style={styles.remaining}>{budget.remaining >= 0 ? `${formatMMK(budget.remaining)} remaining` : `${formatMMK(Math.abs(budget.remaining))} over limit`} · {Math.round(budget.usagePercentage)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.md, ...shadows.soft },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  titleWrap: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  icon: { fontSize: 22 },
  title: { color: colors.text, fontFamily: fontFamily.semiBold, fontSize: 15 },
  status: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 12, marginTop: 2 },
  actions: { flexDirection: 'row' },
  action: { alignItems: 'center', height: 34, justifyContent: 'center', width: 34 },
  amountRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm, marginTop: spacing.lg },
  spent: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 14, fontVariant: ['tabular-nums'] },
  muted: { color: colors.textMuted, fontFamily: fontFamily.medium, fontSize: 12 },
  limit: { color: colors.textMuted, fontFamily: fontFamily.medium, fontSize: 12, fontVariant: ['tabular-nums'] },
  remaining: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 12, marginTop: spacing.sm },
});
