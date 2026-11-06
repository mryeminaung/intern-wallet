import type { BottomTabBarProps } from 'expo-router/build/layouts/Tabs';
import { useRouter } from 'expo-router';
import { ChartNoAxesCombined, House, Plus, ReceiptText, Target, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { shadows, spacing } from '../../theme/spacing';
import { fontFamily } from '../../theme/typography';

const tabIcons: Record<string, LucideIcon> = {
  index: House,
  transactions: ReceiptText,
  reports: ChartNoAxesCombined,
  plan: Target,
};

const tabLabels: Record<string, string> = {
  index: 'Today',
  transactions: 'Activity',
  reports: 'Insights',
  plan: 'Plan',
};

export function FloatingTabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps): React.JSX.Element {
  const router = useRouter();
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

          const tab = <Pressable
              accessibilityLabel={accessibilityLabel}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              key={route.key}
              onPress={onPress}
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            >
              <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}><Icon color={isFocused ? colors.white : '#87938A'} size={21} strokeWidth={2.2} /></View>
              <Text style={[styles.label, isFocused && styles.labelActive]}>{label}</Text>
            </Pressable>;

          if (index === 2) {
            return <View key={route.key} style={styles.segment}><Pressable accessibilityLabel="Add transaction" accessibilityRole="button" onPress={() => router.push('/transactions/new')} style={({ pressed }) => [styles.addButton, pressed && styles.itemPressed]}><Plus color={colors.white} size={27} strokeWidth={2.4} /></Pressable><Text style={styles.addLabel}>Add</Text>{tab}</View>;
          }

          return tab;
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
    minHeight: 74,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    ...shadows.floating,
  },
  item: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
    justifyContent: 'center',
    minHeight: 60,
    minWidth: 0,
    paddingHorizontal: 2,
    paddingVertical: spacing.xs,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 13,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  iconWrapActive: {
    backgroundColor: colors.forest,
  },
  itemPressed: {
    opacity: 0.78,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
    color: '#87938A',
  },
  labelActive: {
    color: colors.forest,
    fontFamily: fontFamily.semiBold,
  },
  segment: {
    alignItems: 'center',
    flex: 2,
    flexDirection: 'row',
  },
  addButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.forest,
    borderColor: colors.background,
    borderRadius: 99,
    borderWidth: 5,
    height: 62,
    justifyContent: 'center',
    marginTop: -19,
    width: 62,
    ...shadows.floating,
  },
  addLabel: {
    color: colors.forest,
    fontFamily: fontFamily.semiBold,
    fontSize: 10,
    left: 0,
    position: 'absolute',
    top: 45,
    width: 62,
    textAlign: 'center',
  },
});
