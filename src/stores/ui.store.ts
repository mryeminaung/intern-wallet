import { create } from 'zustand';

type UiState = {
  isDatabaseReady: boolean;
  notice: { id: number; message: string } | null;
  setDatabaseReady: (isReady: boolean) => void;
  showNotice: (message: string) => void;
  clearNotice: (id: number) => void;
};

let nextNoticeId = 0;

export const useUiStore = create<UiState>((set) => ({
  isDatabaseReady: false,
  notice: null,
  setDatabaseReady: (isDatabaseReady) => set({ isDatabaseReady }),
  showNotice: (message) => set({ notice: { id: ++nextNoticeId, message } }),
  clearNotice: (id) => set((state) => state.notice?.id === id ? { notice: null } : state),
}));
