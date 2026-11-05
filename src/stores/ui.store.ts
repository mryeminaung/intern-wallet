import { create } from 'zustand';

type UiState = {
  isDatabaseReady: boolean;
  setDatabaseReady: (isReady: boolean) => void;
};

export const useUiStore = create<UiState>((set) => ({
  isDatabaseReady: false,
  setDatabaseReady: (isDatabaseReady) => set({ isDatabaseReady }),
}));
