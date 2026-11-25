import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { Stack, usePathname, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium';
import { DMSans_600SemiBold } from '@expo-google-fonts/dm-sans/600SemiBold';
import { DMSans_700Bold } from '@expo-google-fonts/dm-sans/700Bold';
import { NotoSansMyanmar_400Regular } from '@expo-google-fonts/noto-sans-myanmar/400Regular';
import { initializeDatabase } from '@/database/client';
import { SqliteSettingsRepository } from '@/database/repositories/settings.repository';
import { SqliteTransactionRepository } from '@/database/repositories/transaction.repository';
import { DATABASE_NAME, settingKeys } from '@/lib/constants';
import { ToastBanner } from '@/components/shared/ToastBanner';
import { colors } from '@/theme/colors';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout(): React.JSX.Element | null {
  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    NotoSansMyanmar_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={initializeDatabase} useSuspense>
        <AppNavigator />
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}

function AppNavigator(): React.JSX.Element {
  const database = useSQLiteContext();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'web') return;
    let active = true;
    let subscription: { remove(): void } | null = null;
    void import('expo-notifications').then(async (Notifications) => {
      if (!active) return;
      const open = (route: unknown): void => {
        if (route === '/budget' || route === '/daily-budget') router.push(route);
      };
      subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        open(response.notification.request.content.data?.route);
        void Notifications.clearLastNotificationResponseAsync();
      });
      const last = await Notifications.getLastNotificationResponseAsync();
      if (active && last) {
        open(last.notification.request.content.data?.route);
        await Notifications.clearLastNotificationResponseAsync();
      }
    }).catch(() => undefined);
    return () => { active = false; subscription?.remove(); };
  }, [router]);

  useEffect(() => {
    let active = true;
    const guard = async (): Promise<void> => {
      try {
        const settings = new SqliteSettingsRepository(database);
        let completed = await settings.get(settingKeys.onboardingCompleted) === 'true';
        if (!completed) {
          const transactions = new SqliteTransactionRepository(database);
          const [transactionCount, dailyLimit, startDate, endDate] = await Promise.all([
            transactions.count(),
            settings.get(settingKeys.dailyBudgetLimit),
            settings.get(settingKeys.internshipStartDate),
            settings.get(settingKeys.internshipEndDate),
          ]);
          const existingUser = transactionCount > 0 || dailyLimit !== null || startDate !== null || endDate !== null;
          if (existingUser) {
            await settings.set(settingKeys.onboardingCompleted, 'true');
            completed = true;
          }
        }
        if (!active) return;
        if (!completed && pathname !== '/onboarding') router.replace('/onboarding');
        if (completed && pathname === '/onboarding') router.replace('/');
      } catch {
        // Do not block the wallet if the optional first-run check fails.
      }
    };
    void guard();
    return () => { active = false; };
  }, [database, pathname, router]);

  return <><Stack screenOptions={{ headerShown: false, statusBarStyle: 'dark', contentStyle: { backgroundColor: colors.background } }} /><ToastBanner /></>;
}
