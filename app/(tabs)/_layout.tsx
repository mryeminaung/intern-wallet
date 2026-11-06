import { Tabs } from 'expo-router';
import { FloatingTabBar } from '../../src/components/shared/FloatingTabBar';

export default function TabsLayout(): React.JSX.Element {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="transactions" options={{ title: 'Activity' }} />
      <Tabs.Screen name="reports" options={{ title: 'Insights' }} />
      <Tabs.Screen name="plan" options={{ title: 'Plan' }} />
    </Tabs>
  );
}
