import type { BottomTabBarProps } from 'expo-router/build/layouts/Tabs';
import { ChartNoAxesCombined, House, ReceiptText, Settings, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { shadows, spacing } from '../../theme/spacing';
import { fontFamily } from '../../theme/typography';

const tabIcons: Record<string, LucideIcon> = {
  index: House,
  transactions: ReceiptText,
  reports: ChartNoAxesCombined,
  settings: Settings,
};

const tabLabels: Record<string, string> = {
  index: 'Home',
  transactions: 'Transactions',
  reports: 'Reports',
  settings: 'Settings',
};

export function FloatingTabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps): React.JSX.Element {
  const contextInsets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, contextInsets.bottom);

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(bottomInset, spacing.sm) }]}>
      <View style={styles.container}>
        {state.routes.map((route, index) => {
          const descriptor = descriptors[route.key];
          const options = descriptor.options;
          const isFocused = state.index === index;
          const Icon = tabIcons[route.name] ?? House;
          const label = typeof options.tabBarLabel === 'string'
            ? options.tabBarLabel
            : options.title ?? tabLabels[route.name] ?? route.name;
          const accessibilityLabel = options.tabBarAccessibilityLabel ?? `${label} tab`;

          const onPress = (): void => {
            if (isFocused) {
              return;
            }

            const event = emitter.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!event.defaultPrevented) {
              navigateToTab(route.key);
            }
          };

          return (
            <Pressable
              accessibilityLabel={accessibilityLabel}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              key={route.key}
              onPress={onPress}
              style={({ pressed }) => [styles.item, isFocused && styles.itemActive, pressed && styles.itemPressed]}
            >
              <Icon color={isFocused ? colors.white : '#87938A'} size={22} strokeWidth={2.2} />
              {isFocused ? <Text style={styles.label}>{label}</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  container: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderColor: 'rgba(226, 231, 225, 0.96)',
    borderRadius: 30,
    flexDirection: 'row',
    minHeight: 66,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    ...shadows.floating,
  },
  item: {
    alignItems: 'center',
    borderRadius: 24,
    flex: 1,
    gap: 3,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  itemActive: {
    backgroundColor: colors.forest,
  },
  itemPressed: {
    opacity: 0.78,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    color: colors.white,
  },
});
