import { isValidDateString } from '@/lib/date';
import { normalizeSourceKey } from '@/lib/money-source';
import type { SqliteTransferRepository } from '@/database/repositories/transfer.repository';
import type { CreateTransferInput, Transfer } from '@/types/common';

export class TransferService {
  public constructor(private readonly transfers: Pick<SqliteTransferRepository, 'create' | 'update' | 'delete'>) {}

  public async create(input: CreateTransferInput): Promise<Transfer> {
    return this.transfers.create(this.validate(input));
  }

  public async update(id: string, input: CreateTransferInput): Promise<Transfer> {
    const updated = await this.transfers.update(id, this.validate(input));
    if (!updated) throw new Error('This transfer no longer exists.');
    return updated;
  }

  public async delete(id: string): Promise<void> {
    if (!await this.transfers.delete(id)) throw new Error('This transfer was already deleted.');
  }

  private validate(input: CreateTransferInput): CreateTransferInput {
    const fromSourceKey = normalizeSourceKey(input.fromSourceKey);
    const toSourceKey = normalizeSourceKey(input.toSourceKey);
    if (!fromSourceKey || !toSourceKey) throw new Error('Choose valid money sources.');
    if (fromSourceKey === toSourceKey) throw new Error('Choose two different money sources.');
    if (!Number.isSafeInteger(input.amount) || input.amount <= 0) throw new Error('Enter a positive whole-number amount.');
    if (!isValidDateString(input.date)) throw new Error('Choose a valid transfer date.');
    if (input.note && input.note.length > 250) throw new Error('Note must be 250 characters or fewer.');
    return { ...input, fromSourceKey, toSourceKey, note: input.note?.trim() || null };
  }
}
