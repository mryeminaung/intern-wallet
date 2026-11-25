import { TransferService } from '@/features/transfers/transfer.service';
import type { SqliteTransferRepository } from '@/database/repositories/transfer.repository';

describe('TransferService', () => {
  const date = '2026-11-26T08:00:00.000Z';

  it('normalizes bank identity and preserves the transfer amount', async () => {
    const create = jest.fn(async (input) => ({ id: 't1', ...input }));
    const service = new TransferService({ create } as unknown as SqliteTransferRepository);
    await service.create({ fromSourceKey: 'cash', toSourceKey: 'bank: KBZ ', amount: 5000, note: ' Savings ', date });
    expect(create).toHaveBeenCalledWith({ fromSourceKey: 'cash', toSourceKey: 'bank:kbz', amount: 5000, note: 'Savings', date });
  });

  it('rejects a transfer to the same source regardless of bank casing', async () => {
    const create = jest.fn();
    const service = new TransferService({ create } as unknown as SqliteTransferRepository);
    await expect(service.create({ fromSourceKey: 'bank:KBZ', toSourceKey: 'bank:kbz', amount: 1000, note: null, date })).rejects.toThrow('different');
    expect(create).not.toHaveBeenCalled();
  });
});
