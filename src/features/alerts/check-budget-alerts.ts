import type { SQLiteDatabase } from 'expo-sqlite';
import { SqliteAlertEventRepository } from '@/database/repositories/alert-event.repository';
import { SqliteAnalyticsRepository } from '@/database/repositories/analytics.repository';
import { SqliteBudgetRepository } from '@/database/repositories/budget.repository';
import { SqliteCategoryRepository } from '@/database/repositories/category.repository';
import { SqliteSettingsRepository } from '@/database/repositories/settings.repository';
import { BudgetService } from '@/features/budget/services/budget.service';
import { DailyBudgetService } from '@/features/budget/services/daily-budget.service';
import { formatMonth } from '@/lib/date';
import { AlertService, buildBudgetAlerts, loadAlertPreferences } from './alert.service';
import { sendBudgetNotification } from './notification.gateway';

export async function checkBudgetAlerts(database: SQLiteDatabase): Promise<void> {
  const settings = new SqliteSettingsRepository(database);
  const preferences = await loadAlertPreferences(settings);
  if ((!preferences.daily && !preferences.monthly && !preferences.category) || (!preferences.at80 && !preferences.at100)) return;
  const analytics = new SqliteAnalyticsRepository(database);
  const [daily, monthly] = await Promise.all([
    new DailyBudgetService(analytics, settings).getSummary(),
    new BudgetService(new SqliteBudgetRepository(database), new SqliteCategoryRepository(database), analytics).getSummary(formatMonth()),
  ]);
  await new AlertService(new SqliteAlertEventRepository(database), sendBudgetNotification).notify(buildBudgetAlerts(daily, monthly, preferences));
}
