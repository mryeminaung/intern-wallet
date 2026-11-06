import { z } from 'zod';
import type { SettingsRepository } from '../../../database/repositories/settings.repository';
import { settingKeys } from '../../../lib/constants';

const profileSchema = z.object({
  displayName: z.string().trim().min(1, 'Enter a display name.').max(40, 'Keep your name under 40 characters.'),
  role: z.string().trim().max(60, 'Keep your role under 60 characters.'),
  organization: z.string().trim().max(60, 'Keep your organization under 60 characters.'),
  avatarUri: z.string().trim().nullable(),
});

export type Profile = z.output<typeof profileSchema>;
export type ProfileInput = z.input<typeof profileSchema>;

export const emptyProfile: Profile = { displayName: '', role: '', organization: '', avatarUri: null };

export class ProfileService {
  public constructor(private readonly settings: SettingsRepository) {}

  public async get(): Promise<Profile> {
    const [displayName, role, organization, avatarUri] = await Promise.all([
      this.settings.get(settingKeys.profileName),
      this.settings.get(settingKeys.profileRole),
      this.settings.get(settingKeys.profileOrganization),
      this.settings.get(settingKeys.profileAvatarUri),
    ]);
    return {
      displayName: displayName ?? '',
      role: role ?? '',
      organization: organization ?? '',
      avatarUri: avatarUri || null,
    };
  }

  public async save(input: ProfileInput): Promise<Profile> {
    const profile = profileSchema.parse(input);
    await this.settings.setMany([
      { key: settingKeys.profileName, value: profile.displayName },
      { key: settingKeys.profileRole, value: profile.role },
      { key: settingKeys.profileOrganization, value: profile.organization },
      { key: settingKeys.profileAvatarUri, value: profile.avatarUri ?? '' },
    ]);
    return profile;
  }
}
