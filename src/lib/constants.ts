export const APP_NAME = 'Intern Wallet';
export const CURRENCY_CODE = 'MMK';
export const DATABASE_NAME = 'intern-wallet.db';
export const DATABASE_SCHEMA_VERSION = 1;
export const PERSONAL_SAVINGS_CATEGORY_ID = 'f2222222-2222-4222-8222-222222222222';

export const settingKeys = {
  dailyBudgetLimit: 'daily_budget_limit',
  internshipStartDate: 'internship_start_date',
  internshipEndDate: 'internship_end_date',
  dateFormat: 'date_format',
  currencyDisplay: 'currency_display',
  onboardingCompleted: 'onboarding_completed',
} as const;
