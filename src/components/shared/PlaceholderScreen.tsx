import { StyleSheet, Text, View } from 'react-native';
import { Screen } from './Screen';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fontFamily } from '../../theme/typography';

type PlaceholderScreenProps = {
  title: string;
  message: string;
};

export function PlaceholderScreen({ title, message }: PlaceholderScreenProps): React.JSX.Element {
  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  message: {
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
  },
});
