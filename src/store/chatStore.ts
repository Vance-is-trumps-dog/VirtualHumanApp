import { create } from 'zustand';
import { Message, ChatMode } from '../types';
import MessageDAO from '../database/MessageDAO';
import AIService from '../services/AIService';
import IntelligentConversationManager from '../services/IntelligentConversationManager';

interface ChatState {
  messages: Message[];
  loading: boolean;
  typing: boolean;
  error: string | null;
  loadMessages: (virtualHumanId: string) => Promise<void>;
  sendMessage: (virtualHumanId: string, content: string, mode: ChatMode) => Promise<void>;
  clearError: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  loading: false,
  typing: false,
  error: null,

  loadMessages: async (virtualHumanId: string) => {
    set({ loading: true, error: null });
    try {
      const messages = await MessageDAO.getChatHistory(virtualHumanId);
      set({ messages: messages.reverse(), loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  sendMessage: async (virtualHumanId: string, content: string, mode: ChatMode) => {
    set({ typing: true, error: null });
    try {
      // 1. Save user message
      const userMsg = await MessageDAO.create({
        virtualHumanId: virtualHumanId,
        role: 'user',
        content,
        mode: mode
      });

      set(state => ({ messages: [...state.messages, userMsg] }));

      // 2. Get AI Response
      const aiRes = await IntelligentConversationManager.processConversation({
        virtualHumanId,
        userMessage: content,
        mode
      });

      // 3. Save AI message
      const aiMsg = await MessageDAO.create({
        virtualHumanId: virtualHumanId,
        role: 'assistant',
        content: aiRes.content,
        mode: 'text',
        emotion: aiRes.emotion
      });

      set(state => ({
        messages: [...state.messages, aiMsg],
        typing: false
      }));

    } catch (error) {
      set({ error: String(error), typing: false });
    }
  },

  clearError: () => set({ error: null })
}));
