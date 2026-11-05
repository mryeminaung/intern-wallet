import { create } from 'zustand';

type SettingsState = {
  currency: 'MMK';
  setCurrency: (currency: 'MMK') => void;
};

// This store only holds transient UI preferences. Durable settings belong in SQLite.
export const useSettingsStore = create<SettingsState>((set) => ({
  currency: 'MMK',
  setCurrency: (currency) => set({ currency }),
}));
