import { create } from 'zustand';
import type { TransactionType } from '@/types/common';

type TransactionFilterState = {
  type: TransactionType | 'all';
  categoryId: string | null;
  sourceKey: string | null;
  setType: (type: TransactionType | 'all') => void;
  setCategoryId: (categoryId: string | null) => void;
  setSourceKey: (sourceKey: string | null) => void;
  reset: () => void;
};

export const useTransactionFilterStore = create<TransactionFilterState>((set) => ({
  type: 'all',
  categoryId: null,
  sourceKey: null,
  setType: (type) => set({ type }),
  setCategoryId: (categoryId) => set({ categoryId }),
  setSourceKey: (sourceKey) => set({ sourceKey }),
  reset: () => set({ type: 'all', categoryId: null, sourceKey: null }),
}));
