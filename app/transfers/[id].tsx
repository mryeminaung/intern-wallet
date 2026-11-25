import { useLocalSearchParams } from 'expo-router';
import { TransferEditor } from '@/features/transfers/TransferEditor';
export default function EditTransferScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TransferEditor id={Array.isArray(id) ? id[0] : id} />;
}
