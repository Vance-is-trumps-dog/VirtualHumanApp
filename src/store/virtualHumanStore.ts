import { create } from 'zustand';
import { VirtualHuman } from '../types';
import VirtualHumanDAO from '../database/VirtualHumanDAO';
import { validateCreateVirtualHumanInput } from '../utils/InputValidator';

interface VirtualHumanState {
  virtualHumans: VirtualHuman[];
  currentVirtualHuman: VirtualHuman | null;
  loading: boolean;
  error: string | null;
  createVirtualHuman: (data: any) => Promise<void>;
  loadVirtualHumans: () => Promise<void>;
  setCurrentVirtualHuman: (id: string | null) => void;
}

export const useVirtualHumanStore = create<VirtualHumanState>((set, get) => ({
  virtualHumans: [],
  currentVirtualHuman: null,
  loading: false,
  error: null,

  loadVirtualHumans: async () => {
    set({ loading: true });
    try {
      const data = await VirtualHumanDAO.getAll();
      set({ virtualHumans: data, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  createVirtualHuman: async (data: any) => {
    set({ loading: true });
    try {
      const validated = validateCreateVirtualHumanInput(data);
      const newVH = await VirtualHumanDAO.create(validated);
      set(state => ({
        virtualHumans: [newVH, ...state.virtualHumans],
        loading: false
      }));
    } catch (e: any) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },

  setCurrentVirtualHuman: (id: string | null) => {
    if (!id) {
      set({ currentVirtualHuman: null });
      return;
    }
    const { virtualHumans } = get();
    const target = virtualHumans.find(vh => vh.id === id) || null;
    set({ currentVirtualHuman: target });
  }
}));
