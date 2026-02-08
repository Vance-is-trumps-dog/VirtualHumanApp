/**
 * 聊天Store（更新版 - 支持语音）
 */

import { create } from 'zustand';
import { Message, ChatMode } from '@types';
import MessageDAO from '@database/MessageDAO';
import AIService from '@services/AIService';
import SpeechService from '@services/SpeechService';
import VirtualHumanDAO from '@database/VirtualHumanDAO';
import MemoryDAO from '@database/MemoryDAO';
import IntelligentConversationManager from '@services/IntelligentConversationManager';

interface ChatState {
  // 状态
  messages: Message[];
  loading: boolean;
  typing: boolean;
  error: string | null;

  // 操作
  loadMessages: (virtualHumanId: string) => Promise<void>;
  sendMessage: (virtualHumanId: string, content: string, mode: ChatMode) => Promise<void>;
  clearMessages: () => void;
  deleteMessage: (id: string) => Promise<void>;
  markAsImportant: (id: string, important: boolean) => Promise<void>;
  clearError: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // 初始状态
  messages: [],
  loading: false,
  typing: false,
  error: null,

  // 加载消息
  loadMessages: async (virtualHumanId: string) => {
    set({ loading: true, error: null });
    try {
      const messages = await MessageDAO.getChatHistory(virtualHumanId, 50);
      set({ messages, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  // 发送消息
  sendMessage: async (virtualHumanId: string, content: string, mode: ChatMode) => {
    set({ typing: true, error: null });

    try {
      // 1. 保存用户消息
      const userMessage = await MessageDAO.create({
        virtualHumanId,
        role: 'user',
        content,
        mode,
      });

      set(state => ({
        messages: [...state.messages, userMessage],
      }));

      // 2. 获取虚拟人信息
      const virtualHuman = await VirtualHumanDAO.getById(virtualHumanId);
      if (!virtualHuman) {
        throw new Error('Virtual human not found');
      }

      // 3. 获取最近的消息作为上下文
      const recentMessages = await MessageDAO.getRecentMessages(virtualHumanId, 10);

      // 4. 使用智能对话管理器（整合所有智能功能）
      const startTime = Date.now();
      const aiResponse = await IntelligentConversationManager.processConversation({
        virtualHumanId,
        userMessage: content,
        mode,
      });

      const responseTime = Date.now() - startTime;

      console.log('AI Response metadata:', aiResponse.metadata);

      // 6. 如果是语音模式，生成语音
      let audioUrl: string | undefined;
      let audioDuration: number | undefined;

      if (mode === 'voice') {
        try {
          audioUrl = await SpeechService.textToSpeech(
            aiResponse.content,
            virtualHuman.voiceId
          );
          // 可以获取音频时长，这里简化处理
          audioDuration = Math.ceil(aiResponse.content.length / 10); // 粗略估算
        } catch (error) {
          console.error('TTS failed:', error);
          // 即使TTS失败，也保存文字消息
        }
      }

      // 7. 保存AI回复
      const assistantMessage = await MessageDAO.create({
        virtualHumanId,
        role: 'assistant',
        content: aiResponse.content,
        mode,
        emotion: aiResponse.emotion,
        tokensUsed: aiResponse.tokensUsed,
        responseTime,
        audioUrl,
        audioDuration,
      });

      set(state => ({
        messages: [...state.messages, assistantMessage],
        typing: false,
      }));

      // 8. 更新虚拟人统计
      await VirtualHumanDAO.updateLastInteraction(virtualHumanId);
      await VirtualHumanDAO.incrementStats(virtualHumanId, 'totalMessages', 2);

      // 9. 记忆提取已在 IntelligentConversationManager 中异步处理
    } catch (error) {
      set({ error: (error as Error).message, typing: false });
      throw error;
    }
  },

  // 清空消息
  clearMessages: () => set({ messages: [] }),

  // 删除消息
  deleteMessage: async (id: string) => {
    try {
      await MessageDAO.delete(id);
      set(state => ({
        messages: state.messages.filter(m => m.id !== id),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  // 标记为重要
  markAsImportant: async (id: string, important: boolean) => {
    try {
      await MessageDAO.markAsImportant(id, important);
      set(state => ({
        messages: state.messages.map(m =>
          m.id === id ? { ...m, isImportant: important } : m
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  // 清除错误
  clearError: () => set({ error: null }),
}));
