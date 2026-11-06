import * as ImagePicker from 'expo-image-picker';
import { File, Paths } from 'expo-file-system';

const MAX_PROFILE_IMAGE_BYTES = 10_000_000;

export async function chooseProfileImage(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    aspect: [1, 1],
    mediaTypes: ['images'],
    quality: 0.75,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset) throw new Error('The selected photo could not be opened.');
  if (asset.fileSize !== undefined && asset.fileSize > MAX_PROFILE_IMAGE_BYTES) {
    throw new Error('Choose a photo smaller than 10 MB.');
  }
  return asset.uri;
}

export async function persistProfileImage(sourceUri: string): Promise<string> {
  const source = new File(sourceUri);
  const extension = supportedExtension(source.extension);
  const destination = new File(Paths.document, `profile-avatar-${Date.now()}${extension}`);
  await source.copy(destination, { overwrite: true });
  return destination.uri;
}

export function deleteOwnedProfileImage(uri: string | null): void {
  if (!uri || !uri.startsWith(Paths.document.uri)) return;
  const file = new File(uri);
  if (!file.name.startsWith('profile-avatar-') || !file.exists) return;
  file.delete();
}

function supportedExtension(extension: string): string {
  const normalized = extension.toLocaleLowerCase();
  return ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'].includes(normalized) ? normalized : '.jpg';
}
