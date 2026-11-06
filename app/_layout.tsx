import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { Stack, usePathname, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { NotoSansMyanmar_400Regular } from '@expo-google-fonts/noto-sans-myanmar';
import { initializeDatabase } from '../src/database/client';
import { SqliteSettingsRepository } from '../src/database/repositories/settings.repository';
import { SqliteTransactionRepository } from '../src/database/repositories/transaction.repository';
import { DATABASE_NAME, settingKeys } from '../src/lib/constants';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout(): React.JSX.Element | null {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
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

  return <Stack screenOptions={{ headerShown: false }} />;
}
