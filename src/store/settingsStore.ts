/**
 * Zustand状态管理 - 应用设置Store
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings } from '@types';

interface SettingsState extends AppSettings {
  // 操作
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

const DEFAULT_SETTINGS: AppSettings = {
  apiProvider: 'openai',
  apiModel: 'gpt-4-turbo',
  voiceVolume: 0.8,
  voiceSpeed: 1.0,
  autoPlay: true,
  noiseReduction: false,
  videoQuality: 'medium',
  frameRate: 30,
  powerSaveMode: false,
  theme: 'auto',
  language: 'zh-CN',
  fontSize: 14,
  animationEnabled: true,
  biometricLock: false,
  encryptChatHistory: false,
  allowAnalytics: true,
};

const STORAGE_KEY = '@app_settings';

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // 初始状态（使用默认值）
  ...DEFAULT_SETTINGS,

  // 加载设置
  loadSettings: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const settings = JSON.parse(stored);
        set(settings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  },

  // 更新设置
  updateSettings: async (newSettings: Partial<AppSettings>) => {
    try {
      const currentSettings = get();
      const updatedSettings = { ...currentSettings, ...newSettings };

      // 移除操作函数，只保存数据
      const { loadSettings, updateSettings, resetSettings, ...dataToSave } = updatedSettings as any;

      set(newSettings);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  },

  // 重置设置
  resetSettings: async () => {
    try {
      set(DEFAULT_SETTINGS);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    } catch (error) {
      console.error('Failed to reset settings:', error);
    }
  },
}));
