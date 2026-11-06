import { z } from 'zod';
import type { WalletData } from '../../../types/common';
import { DataManagementRepository } from '../../../database/repositories/data-management.repository';
import { settingKeys } from '../../../lib/constants';

const isoDate = z.string().refine((value) => Number.isFinite(Date.parse(value)), 'Invalid date');
const amount = z.number().int().positive().safe();
const category = z.object({ id: z.string().min(1), name: z.string().min(1), icon: z.string().min(1), type: z.enum(['income', 'expense']), isDefault: z.boolean() }).strict();
const transaction = z.object({ id: z.string().min(1), type: z.enum(['income', 'expense']), amount, categoryId: z.string().min(1), note: z.string().nullable(), date: isoDate, createdAt: isoDate, updatedAt: isoDate }).strict();
const budget = z.object({ id: z.string().min(1), month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/), categoryId: z.string().nullable(), amount }).strict();
const setting = z.object({ key: z.string().min(1), value: z.string() }).strict();
const backupSchema = z.object({
  format: z.literal('intern-wallet-backup'),
  version: z.literal(1),
  createdAt: isoDate,
  data: z.object({ categories: z.array(category), transactions: z.array(transaction), budgets: z.array(budget), settings: z.array(setting) }).strict(),
}).strict().superRefine(({ data }, context) => {
  const categoryById = new Map(data.categories.map((item) => [item.id, item]));
  for (const [name, rows] of [['categories', data.categories], ['transactions', data.transactions], ['budgets', data.budgets]] as const) {
    if (new Set(rows.map((row) => row.id)).size !== rows.length) context.addIssue({ code: 'custom', message: `Duplicate ${name} IDs` });
  }
  if (new Set(data.settings.map((item) => item.key)).size !== data.settings.length) context.addIssue({ code: 'custom', message: 'Duplicate setting keys' });
  for (const item of data.transactions) {
    if (categoryById.get(item.categoryId)?.type !== item.type) context.addIssue({ code: 'custom', message: `Invalid category for transaction ${item.id}` });
  }
  for (const item of data.budgets) {
    if (item.categoryId && categoryById.get(item.categoryId)?.type !== 'expense') context.addIssue({ code: 'custom', message: `Invalid category for budget ${item.id}` });
  }
});

export type BackupPreview = { createdAt: string; transactions: number; categories: number; budgets: number; settings: number };

export class DataManagementService {
  public constructor(private readonly repository: DataManagementRepository) {}

  public async exportCsv(): Promise<string> {
    const data = await this.repository.readAll();
    const categories = new Map(data.categories.map((item) => [item.id, item.name]));
    const rows = data.transactions.map((item) => [item.date, item.type, categories.get(item.categoryId) ?? '', String(item.amount), item.note ?? '']);
    return '\uFEFF' + ['Date,Type,Category,Amount (MMK),Note', ...rows.map((row) => row.map(csvCell).join(','))].join('\r\n');
  }

  public async createBackup(): Promise<string> {
    const data = await this.repository.readAll();
    const portableData = { ...data, settings: data.settings.filter((item) => item.key !== settingKeys.profileAvatarUri) };
    return JSON.stringify({ format: 'intern-wallet-backup', version: 1, createdAt: new Date().toISOString(), data: portableData });
  }

  public previewBackup(json: string): BackupPreview {
    const parsed = parseBackup(json);
    return { createdAt: parsed.createdAt, transactions: parsed.data.transactions.length, categories: parsed.data.categories.length, budgets: parsed.data.budgets.length, settings: parsed.data.settings.length };
  }

  public async restoreBackup(json: string): Promise<void> {
    const parsed = parseBackup(json);
    await this.repository.replaceAll(parsed.data as WalletData);
  }
}

function parseBackup(json: string): z.output<typeof backupSchema> {
  if (json.length > 10_000_000) throw new Error('Backup is too large to restore.');
  try { return backupSchema.parse(JSON.parse(json)); }
  catch { throw new Error('Backup is invalid or from an incompatible version. Your current data was not changed.'); }
}

function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}
