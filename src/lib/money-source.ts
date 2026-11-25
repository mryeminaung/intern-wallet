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

export function sourceKey(sourceType: MoneySourceType | null | undefined, bankName: string | null | undefined): string {
  if (sourceType === 'cash') return 'cash';
  if (sourceType === 'bank' && bankName?.trim()) return `bank:${bankName.trim().toLocaleLowerCase()}`;
  return 'unspecified';
}

export function sourceLabel(key: string): string {
  if (key === 'cash') return 'Cash';
  if (key === 'unspecified') return 'Unspecified';
  return key.startsWith('bank:') ? key.slice(5).toLocaleUpperCase() : key;
}

export function normalizeSourceKey(key: string): string | null {
  if (key === 'cash' || key === 'unspecified') return key;
  const name = key.startsWith('bank:') ? key.slice(5).trim() : '';
  return name && name.length <= 40 ? `bank:${name.toLocaleLowerCase()}` : null;
}
