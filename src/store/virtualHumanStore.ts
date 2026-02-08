/**
 * Zustand状态管理 - 虚拟人Store
 */

import { create } from 'zustand';
import { VirtualHuman, CreateVirtualHumanRequest } from '@types';
import VirtualHumanDAO from '@database/VirtualHumanDAO';
import { validateCreateVirtualHumanInput } from '@utils/InputValidator';

interface VirtualHumanState {
  // 状态
  virtualHumans: VirtualHuman[];
  currentVirtualHuman: VirtualHuman | null;
  loading: boolean;
  error: string | null;

  // 操作
  loadVirtualHumans: () => Promise<void>;
  setCurrentVirtualHuman: (id: string) => void;
  createVirtualHuman: (data: unknown) => Promise<VirtualHuman>;
  updateVirtualHuman: (id: string, data: Partial<VirtualHuman>) => Promise<void>;
  deleteVirtualHuman: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useVirtualHumanStore = create<VirtualHumanState>((set, get) => ({
  // 初始状态
  virtualHumans: [],
  currentVirtualHuman: null,
  loading: false,
  error: null,

  // 加载所有虚拟人
  loadVirtualHumans: async () => {
    set({ loading: true, error: null });
    try {
      const virtualHumans = await VirtualHumanDAO.getAll('active');
      set({ virtualHumans, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  // 设置当前虚拟人
  setCurrentVirtualHuman: (id: string) => {
    const virtualHuman = get().virtualHumans.find(v => v.id === id);
    if (virtualHuman) {
      set({ currentVirtualHuman: virtualHuman });
    }
  },

  // 创建虚拟人（带输入验证）
  createVirtualHuman: async (data: unknown) => {
    set({ loading: true, error: null });
    try {
      // ✅ 验证输入数据（防止恶意数据注入）
      const validatedData = validateCreateVirtualHumanInput(data);

      // 构建CreateVirtualHumanRequest
      const requestData: CreateVirtualHumanRequest = {
        name: validatedData.name,
        age: validatedData.age,
        gender: validatedData.gender || 'other',
        occupation: validatedData.occupation,
        personality: validatedData.personality,
        backgroundStory: validatedData.backgroundStory,
        modelId: validatedData.modelId || 'default',
        voiceId: validatedData.voiceId || 'default',
        outfitId: validatedData.outfitId || 'default',
        templateId: validatedData.templateId,
      };

      const virtualHuman = await VirtualHumanDAO.create(requestData);
      set(state => ({
        virtualHumans: [virtualHuman, ...state.virtualHumans],
        currentVirtualHuman: virtualHuman,
        loading: false,
      }));
      return virtualHuman;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  // 更新虚拟人
  updateVirtualHuman: async (id: string, data: Partial<VirtualHuman>) => {
    set({ loading: true, error: null });
    try {
      await VirtualHumanDAO.update(id, data);
      set(state => ({
        virtualHumans: state.virtualHumans.map(v =>
          v.id === id ? { ...v, ...data } : v
        ),
        currentVirtualHuman:
          state.currentVirtualHuman?.id === id
            ? { ...state.currentVirtualHuman, ...data }
            : state.currentVirtualHuman,
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  // 删除虚拟人
  deleteVirtualHuman: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await VirtualHumanDAO.delete(id);
      set(state => ({
        virtualHumans: state.virtualHumans.filter(v => v.id !== id),
        currentVirtualHuman:
          state.currentVirtualHuman?.id === id ? null : state.currentVirtualHuman,
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  // 清除错误
  clearError: () => set({ error: null }),
}));
