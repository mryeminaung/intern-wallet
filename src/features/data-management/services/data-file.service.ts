import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const MAX_BACKUP_BYTES = 10_000_000;

export type DataFileKind = 'csv' | 'backup';

export type PickedBackupFile = {
  name: string;
  content: string;
};

export async function shareDataFile(content: string, kind: DataFileKind): Promise<string> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('File sharing is not available on this device.');
  }

  const details = kind === 'csv'
    ? { prefix: 'intern-wallet-transactions', extension: 'csv', mimeType: 'text/csv', title: 'Export Intern Wallet transactions' }
    : { prefix: 'intern-wallet-backup', extension: 'json', mimeType: 'application/json', title: 'Export Intern Wallet backup' };
  const fileName = `${details.prefix}-${fileTimestamp(new Date())}.${details.extension}`;
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  await file.write(content);
  await Sharing.shareAsync(file.uri, { dialogTitle: details.title, mimeType: details.mimeType });
  return fileName;
}

export async function pickBackupFile(): Promise<PickedBackupFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: false,
    type: ['application/json', 'text/json', 'text/plain', 'application/octet-stream'],
  });
  if (result.canceled) return null;

  const asset = result.assets[0];
  if (!asset) throw new Error('The selected file could not be opened.');
  if (asset.size !== undefined && asset.size > MAX_BACKUP_BYTES) {
    throw new Error('Backup is too large to restore.');
  }

  const content = asset.file ? await asset.file.text() : await new File(asset.uri).text();
  return { content, name: asset.name };
}

function fileTimestamp(date: Date): string {
  return date.toISOString().replace(/[:.]/g, '-');
}
