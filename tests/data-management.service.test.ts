import type { DataManagementRepository } from '@/database/repositories/data-management.repository';
import { DataManagementService } from '@/features/data-management';
import { settingKeys } from '@/lib/constants';

describe('DataManagementService', () => {
  it('backs up portable profile text without exporting a device-local photo path', async () => {
    const repository = {
      readAll: jest.fn().mockResolvedValue({
        categories: [], transactions: [], budgets: [],
        settings: [
          { key: settingKeys.profileName, value: 'May' },
          { key: settingKeys.profileAvatarUri, value: 'file:///device/profile-avatar.jpg' },
        ],
      }),
    } as unknown as DataManagementRepository;
    const backup = JSON.parse(await new DataManagementService(repository).createBackup()) as { data: { settings: { key: string; value: string }[] } };

    expect(backup.data.settings).toEqual([{ key: settingKeys.profileName, value: 'May' }]);
    expect(JSON.parse(await new DataManagementService(repository).createBackup()).version).toBe(2);
  });

  it('restores a version 1 backup with historical sources unspecified', async () => {
    const replaceAll = jest.fn();
    const service = new DataManagementService({ replaceAll } as unknown as DataManagementRepository);
    const date = '2026-11-04T00:00:00.000Z';
    const backup = JSON.stringify({
      format: 'intern-wallet-backup', version: 1, createdAt: date,
      data: {
        categories: [{ id: 'food', name: 'Food', icon: '🍜', type: 'expense', isDefault: true }],
        transactions: [{ id: 't1', type: 'expense', amount: 1000, categoryId: 'food', note: null, date, createdAt: date, updatedAt: date }],
        budgets: [], settings: [],
      },
    });
    await service.restoreBackup(backup);
    expect(replaceAll).toHaveBeenCalledWith(expect.objectContaining({ transactions: [expect.objectContaining({ sourceType: null, bankName: null })] }));
  });
});
