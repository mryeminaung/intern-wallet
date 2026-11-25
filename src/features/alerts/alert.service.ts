import type { BudgetSummary } from '@/features/budget/services/budget.service';
import type { DailyBudgetSummary } from '@/features/budget/services/daily-budget.service';
import type { SettingsRepository } from '@/database/repositories/settings.repository';
import { dateKey, formatMonth } from '@/lib/date';
import { settingKeys } from '@/lib/constants';

export type BudgetAlert = { key: string; lowerKey?: string; title: string; body: string; route: '/daily-budget' | '/budget' };
export type AlertPreferences = { daily: boolean; monthly: boolean; category: boolean; at80: boolean; at100: boolean };

type AlertEvents = { claim(key: string): Promise<boolean>; release(key: string): Promise<void> };
type AlertSender = (alert: BudgetAlert) => Promise<void>;

export async function loadAlertPreferences(settings: Pick<SettingsRepository, 'get'>): Promise<AlertPreferences> {
  const values = await Promise.all([
    settings.get(settingKeys.alertDaily), settings.get(settingKeys.alertMonthly), settings.get(settingKeys.alertCategory),
    settings.get(settingKeys.alertAt80), settings.get(settingKeys.alertAt100),
  ]);
  return { daily: values[0] === 'true', monthly: values[1] === 'true', category: values[2] === 'true', at80: values[3] !== 'false', at100: values[4] !== 'false' };
}

export function buildBudgetAlerts(daily: DailyBudgetSummary, monthly: BudgetSummary, preferences: AlertPreferences, referenceDate: Date = new Date()): readonly BudgetAlert[] {
  const thresholds = [preferences.at80 ? 80 : null, preferences.at100 ? 100 : null].filter((value): value is number => value !== null);
  const alerts: BudgetAlert[] = [];
  const day = dateKey(referenceDate.toISOString());
  const month = formatMonth(referenceDate);
  const append = (scope: string, usage: number, label: string, route: BudgetAlert['route']): void => {
    const reached = thresholds.filter((threshold) => usage >= threshold);
    const threshold = reached.at(-1);
    if (threshold) alerts.push({
      key: `${scope}:${threshold}`,
      lowerKey: reached.length > 1 ? `${scope}:${reached[0]}` : undefined,
      title: 'Budget update',
      body: `${label} reached ${threshold}% of its limit.`,
      route,
    });
  };
  if (preferences.daily && daily.dailyLimit !== null && daily.dailyLimit > 0) append(`daily:${day}`, daily.usagePercentage ?? 0, 'Today’s spending', '/daily-budget');
  for (const budget of monthly.budgets) {
    if (budget.month !== month) continue;
    if (budget.categoryId === null && preferences.monthly) append(`monthly:${month}:${budget.id}`, budget.usagePercentage, 'Your monthly budget', '/budget');
    if (budget.categoryId !== null && preferences.category) append(`category:${month}:${budget.id}`, budget.usagePercentage, `${budget.category?.name ?? 'A category'} budget`, '/budget');
  }
  return alerts;
}

export class AlertService {
  public constructor(private readonly events: AlertEvents, private readonly send: AlertSender) {}

  public async notify(alerts: readonly BudgetAlert[]): Promise<void> {
    for (const alert of alerts) {
      if (!await this.events.claim(alert.key)) continue;
      let lowerClaimed = false;
      try {
        if (alert.lowerKey) lowerClaimed = await this.events.claim(alert.lowerKey);
        await this.send(alert);
      } catch (cause) {
        await this.events.release(alert.key);
        if (lowerClaimed && alert.lowerKey) await this.events.release(alert.lowerKey);
        throw cause;
      }
    }
  }
}
