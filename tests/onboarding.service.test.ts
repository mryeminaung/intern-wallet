import type { SettingsRepository } from '../src/database/repositories/settings.repository';
import { OnboardingService, recommendedDailyLimit } from '../src/features/onboarding/services/onboarding.service';
import type { TransactionService } from '../src/features/transactions/services/transaction.service';
import { PERSONAL_SAVINGS_CATEGORY_ID, settingKeys } from '../src/lib/constants';

function createDependencies(): { settings: SettingsRepository; transactions: Pick<TransactionService, 'create'> } {
  return {
    settings: { get: jest.fn(), set: jest.fn(), setMany: jest.fn(), list: jest.fn() },
    transactions: { create: jest.fn() },
  };
}

describe('OnboardingService', () => {
  it('stores the plan and creates one opening-balance transaction', async () => {
    const dependencies = createDependencies();
    const service = new OnboardingService(dependencies.settings, dependencies.transactions);
    const referenceDate = new Date(2026, 10, 6, 9, 30);

    await service.complete({
      internshipStartDate: new Date(2026, 10, 1).toISOString(),
      internshipEndDate: new Date(2027, 1, 28).toISOString(),
      startingBalance: 300_000,
      dailyLimit: 10_000,
    }, referenceDate);

    expect(dependencies.settings.set).toHaveBeenNthCalledWith(1, settingKeys.internshipStartDate, new Date(2026, 10, 1).toISOString());
    expect(dependencies.settings.set).toHaveBeenNthCalledWith(2, settingKeys.internshipEndDate, new Date(2027, 1, 28).toISOString());
    expect(dependencies.settings.set).toHaveBeenNthCalledWith(3, settingKeys.dailyBudgetLimit, '10000');
    expect(dependencies.transactions.create).toHaveBeenCalledWith({
      type: 'income',
      amount: 300_000,
      categoryId: PERSONAL_SAVINGS_CATEGORY_ID,
      note: 'Opening balance',
      date: referenceDate.toISOString(),
    });
    expect(dependencies.settings.set).toHaveBeenLastCalledWith(settingKeys.onboardingCompleted, 'true');
  });

  it('allows setup without money or a daily limit', async () => {
    const dependencies = createDependencies();
    const service = new OnboardingService(dependencies.settings, dependencies.transactions);

    await service.complete({
      internshipStartDate: new Date(2026, 10, 6).toISOString(),
      internshipEndDate: new Date(2026, 11, 6).toISOString(),
      startingBalance: 0,
      dailyLimit: null,
    });

    expect(dependencies.transactions.create).not.toHaveBeenCalled();
    expect(dependencies.settings.set).not.toHaveBeenCalledWith(settingKeys.dailyBudgetLimit, expect.anything());
    expect(dependencies.settings.set).toHaveBeenLastCalledWith(settingKeys.onboardingCompleted, 'true');
  });

  it('calculates a conservative whole-number daily recommendation', () => {
    expect(recommendedDailyLimit(
      1_005,
      new Date(2026, 0, 1),
      new Date(2026, 0, 19),
      new Date(2026, 0, 10),
    )).toBe(100);
  });

  it('marks onboarding complete when setup is skipped', async () => {
    const dependencies = createDependencies();
    const service = new OnboardingService(dependencies.settings, dependencies.transactions);
    await service.skip();
    expect(dependencies.settings.set).toHaveBeenCalledWith(settingKeys.onboardingCompleted, 'true');
  });
});
