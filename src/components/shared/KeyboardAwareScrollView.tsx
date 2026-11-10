import type { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  type KeyboardAvoidingViewProps,
  type ScrollViewProps,
} from 'react-native';

type KeyboardAwareScrollViewProps = PropsWithChildren<ScrollViewProps & {
  keyboardVerticalOffset?: number;
  keyboardViewStyle?: KeyboardAvoidingViewProps['style'];
}>;

export function KeyboardAwareScrollView({
  children,
  keyboardDismissMode,
  keyboardShouldPersistTaps = 'handled',
  keyboardVerticalOffset = 0,
  keyboardViewStyle,
  ...scrollViewProps
}: KeyboardAwareScrollViewProps): React.JSX.Element {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={keyboardVerticalOffset}
      style={[styles.container, keyboardViewStyle]}
    >
      <ScrollView
        keyboardDismissMode={keyboardDismissMode ?? (Platform.OS === 'ios' ? 'interactive' : 'on-drag')}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        {...scrollViewProps}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
