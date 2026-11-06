import type { DataManagementRepository } from '../src/database/repositories/data-management.repository';
import { DataManagementService } from '../src/features/data-management/services/data-management.service';
import { settingKeys } from '../src/lib/constants';

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
  });
});
