import type { MoneySourceType } from '@/types/common';

export const defaultBankNames = ['KBZ', 'UAB', 'AYA', 'CB'] as const;

export function normalizeBankName(value: string): string {
  const trimmed = value.trim();
  return defaultBankNames.find((name) => name.toLowerCase() === trimmed.toLowerCase()) ?? trimmed;
}

export function moneySourceLabel(sourceType: MoneySourceType | null | undefined, bankName: string | null | undefined): string {
  if (sourceType === 'cash') return 'Cash';
  if (sourceType === 'bank') return bankName?.trim() || 'Bank';
  return 'Unspecified';
}
