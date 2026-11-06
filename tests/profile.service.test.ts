import type { SettingsRepository } from '../src/database/repositories/settings.repository';
import { settingKeys } from '../src/lib/constants';
import { ProfileService } from '../src/features/profile/services/profile.service';

function repository(values: Partial<Record<string, string>> = {}): SettingsRepository {
  return {
    get: jest.fn(async (key: string) => values[key] ?? null),
    set: jest.fn(),
    setMany: jest.fn(),
    list: jest.fn(),
  };
}

describe('ProfileService', () => {
  it('loads optional profile fields from settings', async () => {
    const settings = repository({ [settingKeys.profileName]: 'May', [settingKeys.profileRole]: 'Design Intern' });
    await expect(new ProfileService(settings).get()).resolves.toEqual({ displayName: 'May', role: 'Design Intern', organization: '', avatarUri: null });
  });

  it('trims and saves a valid profile together', async () => {
    const settings = repository();
    const service = new ProfileService(settings);
    await service.save({ displayName: '  May  ', role: '  UI Intern ', organization: '', avatarUri: 'file:///avatar.jpg' });
    expect(settings.setMany).toHaveBeenCalledWith([
      { key: settingKeys.profileName, value: 'May' },
      { key: settingKeys.profileRole, value: 'UI Intern' },
      { key: settingKeys.profileOrganization, value: '' },
      { key: settingKeys.profileAvatarUri, value: 'file:///avatar.jpg' },
    ]);
  });

  it('requires a display name', async () => {
    const service = new ProfileService(repository());
    await expect(service.save({ displayName: ' ', role: '', organization: '', avatarUri: null })).rejects.toThrow('Enter a display name.');
  });
});
