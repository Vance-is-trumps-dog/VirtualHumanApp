/**
 * 智能对话管理器
 * 协调所有智能服务，提供统一的对话接口
 */

import AIService from './AIService';
import MemoryManagementService from './MemoryManagementService';
import ContextManagementService from './ContextManagementService';
import EmotionAnalysisService from './EmotionAnalysisService';
import PromptOptimizationService from './PromptOptimizationService';
import VirtualHumanDAO from '@database/VirtualHumanDAO';
import MessageDAO from '@database/MessageDAO';
import { Emotion } from '@types';

export interface IntelligentChatRequest {
  virtualHumanId: string;
  userMessage: string;
  mode?: 'text' | 'voice' | 'video';
}

export interface IntelligentChatResponse {
  content: string;
  emotion: Emotion;
  tokensUsed: number;
  metadata: {
    memoriesUsed: number;
    contextMessages: number;
    userEmotionDetected: string;
    responseStyle: string;
  };
}

export class IntelligentConversationManager {
  /**
   * 智能对话处理
   * 整合所有智能功能
   */
  async processConversation(
    request: IntelligentChatRequest
  ): Promise<IntelligentChatResponse> {
    const { virtualHumanId, userMessage } = request;

    // 1. 获取虚拟人信息
    const virtualHuman = await VirtualHumanDAO.getById(virtualHumanId);
    if (!virtualHuman) {
      throw new Error('Virtual human not found');
    }

    // 2. 分析用户情感
    const userEmotion = await EmotionAnalysisService.analyzeEmotion(userMessage);
    console.log('User emotion detected:', userEmotion);

    // 3. 获取智能上下文
    const context = await ContextManagementService.getOptimizedContext(
      virtualHumanId,
      { maxMessages: 15 }
    );

    // 4. 检索相关记忆
    const memories = await MemoryManagementService.retrieveRelevantMemories(
      virtualHumanId,
      userMessage,
      { limit: 5, minRelevanceScore: 0.3 }
    );

    // 5. 生成优化的提示词
    const promptTemplate = PromptOptimizationService.generateCompletePrompt({
      virtualHuman: {
        name: virtualHuman.name,
        age: virtualHuman.age,
        gender: virtualHuman.gender,
        occupation: virtualHuman.occupation,
        personality: virtualHuman.personality,
        backgroundStory: virtualHuman.backgroundStory,
        experiences: [], // 可以从数据库获取
      },
      memories,
      emotion: userEmotion,
    });

    // 6. 获取情感响应参数
    const aiParams = EmotionAnalysisService.getAIParameters(userEmotion);

    // 7. 构建消息列表
    const messages = [
      {
        role: 'system' as const,
        content: promptTemplate.system,
      },
      ...context.messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      {
        role: 'user' as const,
        content: userMessage,
      },
    ];

    // 8. 调用 AI（使用优化的参数）
    const aiResponse = await AIService.chat({
      messages: messages as any,
      personality: virtualHuman.personality,
      temperature: aiParams.temperature,
      maxTokens: aiParams.maxTokens,
    });

    // 9. 提取新记忆（异步）
    this.extractAndSaveMemories(virtualHumanId, userMessage, aiResponse.content);

    // 10. 返回响应
    return {
      content: aiResponse.content,
      emotion: aiResponse.emotion,
      tokensUsed: aiResponse.tokensUsed,
      metadata: {
        memoriesUsed: memories.length,
        contextMessages: context.messages.length,
        userEmotionDetected: `${userEmotion.primary} (${(userEmotion.confidence * 100).toFixed(0)}%)`,
        responseStyle: aiParams.styleHint,
      },
    };
  }

  /**
   * 异步提取并保存记忆
   */
  private async extractAndSaveMemories(
    virtualHumanId: string,
    userMessage: string,
    aiResponse: string
  ): Promise<void> {
    try {
      const extractedMemories = await MemoryManagementService.extractMemoriesFromConversation(
        virtualHumanId,
        userMessage,
        aiResponse
      );

      console.log(`Extracted ${extractedMemories.length} new memories`);
    } catch (error) {
      console.error('Failed to extract memories:', error);
    }
  }

  /**
   * 定期记忆整理
   * 建议每天或每周运行一次
   */
  async performMemoryMaintenance(virtualHumanId: string): Promise<{
    consolidated: number;
    forgotten: number;
  }> {
    // 1. 合并相似记忆
    const consolidated = await MemoryManagementService.consolidateMemories(virtualHumanId);

    // 2. 遗忘不重要的旧记忆
    const forgotten = await MemoryManagementService.forgetIrrelevantMemories(
      virtualHumanId,
      { maxAge: 180, minImportance: 2 } // 6个月，重要性<2
    );

    return { consolidated, forgotten };
  }

  /**
   * 获取对话分析报告
   */
  async getConversationAnalytics(virtualHumanId: string): Promise<{
    context: any;
    memory: any;
    emotionTrend: any;
  }> {
    // 1. 上下文统计
    const contextStats = await ContextManagementService.getContextStats(virtualHumanId);

    // 2. 记忆统计
    const memoryStats = await MemoryManagementService.getMemoryStats(virtualHumanId);

    // 3. 情感趋势分析
    const messages = await MessageDAO.getByVirtualHuman(virtualHumanId, 100);
    const emotions = messages
      .filter(m => m.emotion)
      .map(m => ({
        emotion: m.emotion as Emotion,
        timestamp: m.created_at,
      }));

    const emotionTrend = EmotionAnalysisService.analyzeEmotionTrend(emotions);

    return {
      context: contextStats,
      memory: memoryStats,
      emotionTrend,
    };
  }

  /**
   * 生成对话总结
   */
  async generateConversationSummary(virtualHumanId: string): Promise<string> {
    return await ContextManagementService.generateContextSummary(virtualHumanId);
  }

  /**
   * 获取个性化建议
   * 基于对话历史，给出改进建议
   */
  async getPersonalizationSuggestions(virtualHumanId: string): Promise<string[]> {
    const suggestions: string[] = [];

    // 1. 分析对话统计
    const stats = await ContextManagementService.getContextStats(virtualHumanId);

    if (stats.totalMessages < 10) {
      suggestions.push('多和虚拟人聊天，建立更深的联系');
    }

    if (stats.averageMessageLength < 20) {
      suggestions.push('可以分享更多细节，让对话更丰富');
    }

    // 2. 分析记忆
    const memoryStats = await MemoryManagementService.getMemoryStats(virtualHumanId);

    if (memoryStats.total < 5) {
      suggestions.push('分享更多个人信息，让虚拟人更了解你');
    }

    if (memoryStats.byCategory.preferences === 0) {
      suggestions.push('告诉虚拟人你的喜好和兴趣');
    }

    // 3. 分析情感
    const messages = await MessageDAO.getByVirtualHuman(virtualHumanId, 50);
    const emotions = messages
      .filter(m => m.emotion)
      .map(m => ({
        emotion: m.emotion as Emotion,
        timestamp: m.created_at,
      }));

    const trend = EmotionAnalysisService.analyzeEmotionTrend(emotions);

    if (trend.trend === 'declining') {
      suggestions.push('最近情绪似乎不太好，可以和虚拟人聊聊烦恼');
    }

    if (trend.moodStability < 0.5) {
      suggestions.push('情绪波动较大，虚拟人会陪伴你度过起伏');
    }

    return suggestions;
  }

  /**
   * Few-shot 学习：从历史对话中提取示例
   */
  async extractFewShotExamples(
    virtualHumanId: string,
    count: number = 3
  ): Promise<Array<{ user: string; assistant: string }>> {
    const messages = await MessageDAO.getByVirtualHuman(virtualHumanId, 100);

    // 找出高质量的对话对
    const examples: Array<{ user: string; assistant: string }> = [];

    for (let i = 0; i < messages.length - 1; i++) {
      const current = messages[i];
      const next = messages[i + 1];

      // 用户消息 + AI回复
      if (current.role === 'user' && next.role === 'assistant') {
        // 筛选条件：
        // 1. 消息长度适中（20-200字符）
        // 2. 不是简单的问候
        // 3. 回复也不太短
        if (
          current.content.length >= 20 &&
          current.content.length <= 200 &&
          next.content.length >= 30 &&
          !current.content.match(/^(你好|hi|hello|嗨)/i)
        ) {
          examples.push({
            user: current.content,
            assistant: next.content,
          });

          if (examples.length >= count) {
            break;
          }
        }
      }
    }

    return examples;
  }
}

export default new IntelligentConversationManager();
