import { AlertService, buildBudgetAlerts, type AlertPreferences } from '@/features/alerts/alert.service';
import type { DailyBudgetSummary } from '@/features/budget/services/daily-budget.service';
import type { BudgetSummary } from '@/features/budget/services/budget.service';

const preferences: AlertPreferences = { daily: true, monthly: true, category: true, at80: true, at100: true };
const referenceDate = new Date(2026, 10, 26, 12);
const daily = { dailyLimit: 10000, usagePercentage: 110 } as DailyBudgetSummary;
const monthly = {
  month: '2026-11', totalBudget: 100000, totalSpent: 85000, remaining: 15000, usagePercentage: 85, budgets: [
    { id: 'overall', month: '2026-11', categoryId: null, category: null, amount: 100000, spent: 85000, remaining: 15000, usagePercentage: 85, status: 'approaching' },
    { id: 'food', month: '2026-11', categoryId: 'food', category: { id: 'food', name: 'Food', icon: '🍜', type: 'expense', isDefault: true }, amount: 20000, spent: 20000, remaining: 0, usagePercentage: 100, status: 'exceeded' },
  ],
} satisfies BudgetSummary;

describe('budget alerts', () => {
  it('selects the highest crossed threshold for each scope and period', () => {
    const alerts = buildBudgetAlerts(daily, monthly, preferences, referenceDate);
    expect(alerts.map((alert) => alert.key)).toEqual([
      'daily:2026-11-26:100', 'monthly:2026-11:overall:80', 'category:2026-11:food:100',
    ]);
    expect(alerts[0].lowerKey).toBe('daily:2026-11-26:80');
    expect(alerts.every((alert) => !alert.body.includes('10000') && !alert.body.includes('20000'))).toBe(true);
  });

  it('sends only once and releases a claim if delivery fails', async () => {
    const seen = new Set<string>();
    const events = {
      claim: jest.fn(async (key: string) => { if (seen.has(key)) return false; seen.add(key); return true; }),
      release: jest.fn(async (key: string) => { seen.delete(key); }),
    };
    const send = jest.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined);
    const service = new AlertService(events, send);
    const alert = buildBudgetAlerts(daily, monthly, preferences, referenceDate)[0];
    await expect(service.notify([alert])).rejects.toThrow('offline');
    expect(seen.size).toBe(0);
    await service.notify([alert]);
    await service.notify([alert]);
    expect(send).toHaveBeenCalledTimes(2);
    expect(seen.has(alert.key)).toBe(true);
    expect(seen.has(alert.lowerKey!)).toBe(true);
  });
});
