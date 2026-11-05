import { StyleSheet, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { radii } from '../../../theme/spacing';
import type { BudgetStatus } from '../../../types/common';

type BudgetProgressProps = {
  percentage: number;
  status: BudgetStatus;
};

const statusColors: Record<BudgetStatus, string> = {
  normal: colors.income,
  approaching: '#B9862F',
  'almost-exhausted': '#C87535',
  exceeded: colors.expense,
};

export function BudgetProgress({ percentage, status }: BudgetProgressProps): React.JSX.Element {
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { backgroundColor: statusColors[status], width: `${Math.min(100, Math.max(0, percentage))}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { backgroundColor: colors.border, borderRadius: radii.sm, height: 8, overflow: 'hidden', width: '100%' },
  fill: { borderRadius: radii.sm, height: '100%' },
});
