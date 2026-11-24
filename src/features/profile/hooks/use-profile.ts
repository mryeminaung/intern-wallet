import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SqliteSettingsRepository } from '@/database/repositories/settings.repository';
import {
  emptyProfile,
  type Profile,
  ProfileService,
} from '@/features/profile/services/profile.service';

export function useProfile(): { profile: Profile; refresh: () => Promise<void> } {
  const database = useSQLiteContext();
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const refresh = useCallback(async () => {
    try {
      setProfile(await new ProfileService(new SqliteSettingsRepository(database)).get());
    } catch {
      setProfile(emptyProfile);
    }
  }, [database]);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  return { profile, refresh };
}
