import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';
import { toIsoDate } from '@/lib/date';
import { normalizeSourceKey } from '@/lib/money-source';
import type { CreateTransferInput, Transfer } from '@/types/common';

type TransferRow = {
  id: string;
  from_source_key: string;
  to_source_key: string;
  amount: number;
  note: string | null;
  date: string;
  created_at: string;
  updated_at: string;
};

function mapTransfer(row: TransferRow): Transfer {
  return { id: row.id, fromSourceKey: row.from_source_key, toSourceKey: row.to_source_key, amount: row.amount, note: row.note, date: row.date, createdAt: row.created_at, updatedAt: row.updated_at };
}

export class SqliteTransferRepository {
  public constructor(private readonly database: SQLiteDatabase) {}

  public async list(fromDate?: string, toDate?: string, sourceKey?: string): Promise<readonly Transfer[]> {
    const conditions: string[] = [];
    const params: string[] = [];
    if (fromDate) { conditions.push('date >= ?'); params.push(fromDate); }
    if (toDate) { conditions.push('date <= ?'); params.push(toDate); }
    if (sourceKey) { conditions.push('(from_source_key = ? OR to_source_key = ?)'); params.push(normalizeSourceKey(sourceKey) ?? sourceKey, normalizeSourceKey(sourceKey) ?? sourceKey); }
    const rows = await this.database.getAllAsync<TransferRow>(
      `SELECT * FROM transfers${conditions.length ? ` WHERE ${conditions.join(' AND ')}` : ''} ORDER BY date DESC, created_at DESC`,
      ...params,
    );
    return rows.map(mapTransfer);
  }

  public async getById(id: string): Promise<Transfer | null> {
    const row = await this.database.getFirstAsync<TransferRow>('SELECT * FROM transfers WHERE id = ?', id);
    return row ? mapTransfer(row) : null;
  }

  public async create(input: CreateTransferInput): Promise<Transfer> {
    const id = randomUUID();
    const now = toIsoDate();
    await this.database.runAsync('INSERT INTO transfers (id, from_source_key, to_source_key, amount, note, date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', id, input.fromSourceKey, input.toSourceKey, input.amount, input.note, input.date, now, now);
    const created = await this.getById(id);
    if (!created) throw new Error('Transfer could not be read back.');
    return created;
  }

  public async update(id: string, input: CreateTransferInput): Promise<Transfer | null> {
    const result = await this.database.runAsync('UPDATE transfers SET from_source_key = ?, to_source_key = ?, amount = ?, note = ?, date = ?, updated_at = ? WHERE id = ?', input.fromSourceKey, input.toSourceKey, input.amount, input.note, input.date, toIsoDate(), id);
    return result.changes ? this.getById(id) : null;
  }

  public async delete(id: string): Promise<boolean> {
    const result = await this.database.runAsync('DELETE FROM transfers WHERE id = ?', id);
    return result.changes > 0;
  }
}
