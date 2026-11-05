import { create } from 'zustand';
import type { TransactionType } from '../types/common';

type TransactionFilterState = {
  type: TransactionType | 'all';
  categoryId: string | null;
  setType: (type: TransactionType | 'all') => void;
  setCategoryId: (categoryId: string | null) => void;
  reset: () => void;
};

export const useTransactionFilterStore = create<TransactionFilterState>((set) => ({
  type: 'all',
  categoryId: null,
  setType: (type) => set({ type }),
  setCategoryId: (categoryId) => set({ categoryId }),
  reset: () => set({ type: 'all', categoryId: null }),
}));
