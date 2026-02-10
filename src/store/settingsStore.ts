import { create } from 'zustand';
import ConfigService from '../services/ConfigService';

interface SettingsState {
  settings: any;
  loadSettings: () => Promise<void>;
  updateSettings: (settings: any) => Promise<void>;
  resetSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: {},
  loadSettings: async () => {
    try {
      await ConfigService.initialize();
      const config = ConfigService.getConfig();
      set({ settings: config });
    } catch (error) {
      console.error('Failed to load settings:', error);
      set({ settings: {} });
    }
  },
  updateSettings: async (newSettings) => {
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    }));
    try {
      await ConfigService.updateConfig(newSettings);
    } catch (error) {
      console.warn('Failed to persist settings update:', error);
    }
  },
  resetSettings: async () => {
    set({ settings: {} });
  },
}));
