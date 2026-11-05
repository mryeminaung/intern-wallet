import { useTransactionFilterStore } from '../../../stores/transaction-filter.store';
export { useTransactionCategories } from './use-transaction-categories';

export function useTransactionFilters() {
  return useTransactionFilterStore();
}
