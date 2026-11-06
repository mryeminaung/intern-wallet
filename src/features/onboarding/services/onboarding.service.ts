import { calendarDaysInclusive } from '../../../lib/date';
import { PERSONAL_SAVINGS_CATEGORY_ID, settingKeys } from '../../../lib/constants';
import type { SettingsRepository } from '../../../database/repositories/settings.repository';
import type { TransactionService } from '../../transactions/services/transaction.service';

export type OnboardingInput = {
  internshipStartDate: string;
  internshipEndDate: string;
  startingBalance: number;
  dailyLimit: number | null;
};

export class OnboardingService {
  public constructor(
    private readonly settings: SettingsRepository,
    private readonly transactions: Pick<TransactionService, 'create'>,
  ) {}

  public async complete(input: OnboardingInput, referenceDate: Date = new Date()): Promise<void> {
    validateInput(input);
    await this.settings.set(settingKeys.internshipStartDate, input.internshipStartDate);
    await this.settings.set(settingKeys.internshipEndDate, input.internshipEndDate);
    if (input.dailyLimit !== null) {
      await this.settings.set(settingKeys.dailyBudgetLimit, String(input.dailyLimit));
    }
    if (input.startingBalance > 0) {
      await this.transactions.create({
        type: 'income',
        amount: input.startingBalance,
        categoryId: PERSONAL_SAVINGS_CATEGORY_ID,
        note: 'Opening balance',
        date: referenceDate.toISOString(),
      });
    }
    await this.settings.set(settingKeys.onboardingCompleted, 'true');
  }

  public async skip(): Promise<void> {
    await this.settings.set(settingKeys.onboardingCompleted, 'true');
  }
}

export function recommendedDailyLimit(startingBalance: number, internshipStartDate: Date, internshipEndDate: Date, referenceDate: Date = new Date()): number {
  if (!Number.isSafeInteger(startingBalance) || startingBalance <= 0) return 0;
  const spendingStart = referenceDate.getTime() < internshipStartDate.getTime() ? internshipStartDate : referenceDate;
  const days = calendarDaysInclusive(spendingStart, internshipEndDate);
  return days > 0 ? Math.floor(startingBalance / days) : 0;
}

function validateInput(input: OnboardingInput): void {
  const start = new Date(input.internshipStartDate);
  const end = new Date(input.internshipEndDate);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || calendarDaysInclusive(start, end) === 0) {
    throw new Error('Choose a valid internship period.');
  }
  if (!Number.isSafeInteger(input.startingBalance) || input.startingBalance < 0) {
    throw new Error('Starting balance must be a positive whole number or zero.');
  }
  if (input.dailyLimit !== null && (!Number.isSafeInteger(input.dailyLimit) || input.dailyLimit <= 0)) {
    throw new Error('Daily limit must be a positive whole number.');
  }
}
