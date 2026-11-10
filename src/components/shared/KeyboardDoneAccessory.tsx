import { InputAccessoryView, Keyboard, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fontFamily } from '../../theme/typography';

export function KeyboardDoneAccessory({ nativeID }: { nativeID: string }): React.JSX.Element | null {
  if (Platform.OS !== 'ios') return null;

  return (
    <InputAccessoryView nativeID={nativeID}>
      <View style={styles.bar}>
        <Pressable accessibilityRole="button" onPress={Keyboard.dismiss} style={styles.button}>
          <Text style={styles.buttonText}>Done</Text>
        </Pressable>
      </View>
    </InputAccessoryView>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  button: { minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing.sm },
  buttonText: { color: colors.forest, fontFamily: fontFamily.semiBold, fontSize: 16 },
});
