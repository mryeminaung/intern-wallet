import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import { radii, shadows, spacing } from '../../theme/spacing';

export function Surface({ children }: PropsWithChildren): React.JSX.Element {
  return <View style={styles.surface}>{children}</View>;
}

const styles = StyleSheet.create({
  surface: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    ...shadows.soft,
  },
});
