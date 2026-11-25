import { z } from 'zod';
import type { WalletData } from '@/types/common';
import { DataManagementRepository } from '@/database/repositories/data-management.repository';
import { settingKeys } from '@/lib/constants';
import { moneySourceLabel, normalizeSourceKey, sourceLabel } from '@/lib/money-source';
import { isBuiltInAvatarId } from '@/features/profile/avatars';

const isoDate = z.string().refine((value) => Number.isFinite(Date.parse(value)), 'Invalid date');
const amount = z.number().int().positive().safe();
const category = z.object({ id: z.string().min(1), name: z.string().min(1), icon: z.string().min(1), type: z.enum(['income', 'expense']), isDefault: z.boolean() }).strict();
const transactionV1 = z.object({ id: z.string().min(1), type: z.enum(['income', 'expense']), amount, categoryId: z.string().min(1), note: z.string().nullable(), date: isoDate, createdAt: isoDate, updatedAt: isoDate }).strict();
const transactionV2 = transactionV1.extend({ sourceType: z.enum(['cash', 'bank']).nullable(), bankName: z.string().max(40).nullable() }).strict();
const budget = z.object({ id: z.string().min(1), month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/), categoryId: z.string().nullable(), amount }).strict();
const setting = z.object({ key: z.string().min(1), value: z.string() }).strict();
const transfer = z.object({ id: z.string().min(1), fromSourceKey: z.string(), toSourceKey: z.string(), amount, note: z.string().max(250).nullable(), date: isoDate, createdAt: isoDate, updatedAt: isoDate }).strict();
const backupBase = { format: z.literal('intern-wallet-backup'), createdAt: isoDate };
const backupSchema = z.discriminatedUnion('version', [
  z.object({ ...backupBase, version: z.literal(1), data: z.object({ categories: z.array(category), transactions: z.array(transactionV1), budgets: z.array(budget), settings: z.array(setting) }).strict() }).strict(),
  z.object({ ...backupBase, version: z.literal(2), data: z.object({ categories: z.array(category), transactions: z.array(transactionV2), budgets: z.array(budget), settings: z.array(setting) }).strict() }).strict(),
  z.object({ ...backupBase, version: z.literal(3), data: z.object({ categories: z.array(category), transactions: z.array(transactionV2), transfers: z.array(transfer), budgets: z.array(budget), settings: z.array(setting) }).strict() }).strict(),
]).superRefine(({ data }, context) => {
  const categoryById = new Map(data.categories.map((item) => [item.id, item]));
  for (const [name, rows] of [['categories', data.categories], ['transactions', data.transactions], ['budgets', data.budgets], ['transfers', 'transfers' in data ? data.transfers : []]] as const) {
    if (new Set(rows.map((row) => row.id)).size !== rows.length) context.addIssue({ code: 'custom', message: `Duplicate ${name} IDs` });
  }
  if (new Set(data.settings.map((item) => item.key)).size !== data.settings.length) context.addIssue({ code: 'custom', message: 'Duplicate setting keys' });
  for (const item of data.transactions) {
    if (categoryById.get(item.categoryId)?.type !== item.type) context.addIssue({ code: 'custom', message: `Invalid category for transaction ${item.id}` });
  }
  for (const item of data.budgets) {
    if (item.categoryId && categoryById.get(item.categoryId)?.type !== 'expense') context.addIssue({ code: 'custom', message: `Invalid category for budget ${item.id}` });
  }
  if ('transfers' in data) for (const item of data.transfers) {
    if (normalizeSourceKey(item.fromSourceKey) !== item.fromSourceKey || normalizeSourceKey(item.toSourceKey) !== item.toSourceKey || item.fromSourceKey === item.toSourceKey) context.addIssue({ code: 'custom', message: `Invalid source for transfer ${item.id}` });
  }
});

export type BackupPreview = { createdAt: string; transactions: number; transfers: number; categories: number; budgets: number; settings: number };

export class DataManagementService {
  public constructor(private readonly repository: DataManagementRepository) {}

  public async exportCsv(): Promise<string> {
    const data = await this.repository.readAll();
    const categories = new Map(data.categories.map((item) => [item.id, item.name]));
    const rows = [
      ...data.transactions.map((item) => [item.date, item.type, categories.get(item.categoryId) ?? '', moneySourceLabel(item.sourceType, item.bankName), '', String(item.amount), item.note ?? '']),
      ...data.transfers.map((item) => [item.date, 'transfer', '', sourceLabel(item.fromSourceKey), sourceLabel(item.toSourceKey), String(item.amount), item.note ?? '']),
    ].sort((a, b) => a[0].localeCompare(b[0]));
    return '\uFEFF' + ['Date,Type,Category,From,To,Amount (MMK),Note', ...rows.map((row) => row.map(csvCell).join(','))].join('\r\n');
  }

  public async createBackup(): Promise<string> {
    const data = await this.repository.readAll();
    const portableData = { ...data, settings: data.settings.filter((item) => item.key !== settingKeys.profileAvatarUri || isBuiltInAvatarId(item.value)) };
    return JSON.stringify({ format: 'intern-wallet-backup', version: 3, createdAt: new Date().toISOString(), data: portableData });
  }

  public previewBackup(json: string): BackupPreview {
    const parsed = parseBackup(json);
    return { createdAt: parsed.createdAt, transactions: parsed.data.transactions.length, transfers: parsed.data.transfers.length, categories: parsed.data.categories.length, budgets: parsed.data.budgets.length, settings: parsed.data.settings.length };
  }

  public async restoreBackup(json: string): Promise<void> {
    const parsed = parseBackup(json);
    await this.repository.replaceAll(parsed.data);
  }
}

function parseBackup(json: string): { createdAt: string; data: WalletData } {
  if (json.length > 10_000_000) throw new Error('Backup is too large to restore.');
  try {
    const parsed = backupSchema.parse(JSON.parse(json));
    if (parsed.version !== 1) {
      for (const item of parsed.data.transactions) {
        if (item.sourceType === 'bank' ? !item.bankName?.trim() : item.bankName !== null) throw new Error('Invalid source');
      }
    }
    return { createdAt: parsed.createdAt, data: { ...parsed.data, transfers: 'transfers' in parsed.data ? parsed.data.transfers : [], transactions: parsed.data.transactions.map((item) => ({ ...item, sourceType: 'sourceType' in item ? item.sourceType : null, bankName: 'bankName' in item ? item.bankName : null })) } };
  }
  catch { throw new Error('Backup is invalid or from an incompatible version. Your current data was not changed.'); }
}

function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}
