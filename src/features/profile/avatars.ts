export const builtInAvatars = [
  { id: 'builtin-avatar:1', label: 'Avatar 1', source: require('../../../assets/avatars/avatar-1.png') },
  { id: 'builtin-avatar:2', label: 'Avatar 2', source: require('../../../assets/avatars/avatar-2.png') },
  { id: 'builtin-avatar:3', label: 'Avatar 3', source: require('../../../assets/avatars/avatar-3.png') },
  { id: 'builtin-avatar:4', label: 'Avatar 4', source: require('../../../assets/avatars/avatar-4.png') },
  { id: 'builtin-avatar:5', label: 'Avatar 5', source: require('../../../assets/avatars/avatar-5.png') },
  { id: 'builtin-avatar:6', label: 'Avatar 6', source: require('../../../assets/avatars/avatar-6.png') },
  { id: 'builtin-avatar:7', label: 'Avatar 7', source: require('../../../assets/avatars/avatar-7.png') },
  { id: 'builtin-avatar:8', label: 'Avatar 8', source: require('../../../assets/avatars/avatar-8.png') },
  { id: 'builtin-avatar:9', label: 'Avatar 9', source: require('../../../assets/avatars/avatar-9.png') },
  { id: 'builtin-avatar:10', label: 'Avatar 10', source: require('../../../assets/avatars/avatar-10.png') },
  { id: 'builtin-avatar:11', label: 'Avatar 11', source: require('../../../assets/avatars/avatar-11.png') },
  { id: 'builtin-avatar:12', label: 'Avatar 12', source: require('../../../assets/avatars/avatar-12.png') },
] as const;

export type BuiltInAvatarId = (typeof builtInAvatars)[number]['id'];

export function getBuiltInAvatar(id: string | null): (typeof builtInAvatars)[number] | undefined {
  return builtInAvatars.find((avatar) => avatar.id === id);
}

export function isBuiltInAvatarId(id: string | null): id is BuiltInAvatarId {
  return getBuiltInAvatar(id) !== undefined;
}
