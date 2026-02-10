/**
 * 上下文管理服务
 * 管理对话上下文，优化 token 使用
 */

import MessageDAO from '@database/MessageDAO';
import { Message } from '@types';

export interface ConversationContext {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;
  summary?: string;
  tokenCount: number;
}

export class ContextManagementService {
  private readonly MAX_CONTEXT_TOKENS = 3000; // 留给上下文的最大 token 数
  private readonly CHARS_PER_TOKEN = 2.5; // 中文平均每个 token 约 2.5 个字符

  /**
   * 获取优化后的对话上下文
   * 自动处理 token 限制，保留最相关的消息
   */
  async getOptimizedContext(
    virtualHumanId: string,
    options?: {
      maxMessages?: number;
      includeSystemPrompt?: boolean;
    }
  ): Promise<ConversationContext> {
    const maxMessages = options?.maxMessages || 20;

    // 1. 获取最近的消息
    const recentMessages = await MessageDAO.getChatHistory(
      virtualHumanId,
      maxMessages * 2 // 获取更多，稍后筛选
    );

    // 2. 转换为对话格式
    let conversationMessages = recentMessages
      .sort((a, b) => a.created_at - b.created_at)
      .map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content,
        timestamp: msg.created_at,
      }));

    // 3. 估算 token 数
    let totalTokens = this.estimateTokens(
      conversationMessages.map(m => m.content).join('')
    );

    // 4. 如果超过限制，进行压缩
    if (totalTokens > this.MAX_CONTEXT_TOKENS) {
      conversationMessages = await this.compressContext(conversationMessages);
      totalTokens = this.estimateTokens(
        conversationMessages.map(m => m.content).join('')
      );
    }

    return {
      messages: conversationMessages,
      tokenCount: totalTokens,
    };
  }

  /**
   * 压缩上下文
   * 策略：保留最近的对话 + 总结早期对话
   */
  private async compressContext(
    messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: number }>
  ): Promise<typeof messages> {
    const KEEP_RECENT = 10; // 保留最近 10 条消息

    if (messages.length <= KEEP_RECENT) {
      return messages;
    }

    // 1. 分离早期消息和最近消息
    const earlyMessages = messages.slice(0, -KEEP_RECENT);
    const recentMessages = messages.slice(-KEEP_RECENT);

    // 2. 总结早期消息
    const summary = this.summarizeMessages(earlyMessages);

    // 3. 创建总结消息
    const summaryMessage = {
      role: 'assistant' as const,
      content: `[早期对话总结] ${summary}`,
      timestamp: earlyMessages[0].timestamp,
    };

    return [summaryMessage, ...recentMessages];
  }

  /**
   * 总结消息内容
   */
  private summarizeMessages(
    messages: Array<{ role: string; content: string }>
  ): string {
    // 简单总结：提取关键主题
    const contents = messages.map(m => m.content).join(' ');
    const keywords = this.extractKeyTopics(contents);

    return `用户和AI讨论了：${keywords.join('、')}等话题。`;
  }

  /**
   * 提取关键主题
   */
  private extractKeyTopics(text: string, maxTopics: number = 5): string[] {
    // 简化版：统计高频词
    const words = text
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1);

    const stopWords = ['的', '了', '是', '在', '我', '你', '他', '她', '它', '们', '这', '那', '有', '和', '就', '不', '人', '都', '一', '为'];
    const filteredWords = words.filter(w => !stopWords.includes(w));

    // 词频统计
    const frequency: Record<string, number> = {};
    filteredWords.forEach(w => {
      frequency[w] = (frequency[w] || 0) + 1;
    });

    // 按频率排序
    const sorted = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxTopics)
      .map(([word]) => word);

    return sorted;
  }

  /**
   * 估算 token 数量
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / this.CHARS_PER_TOKEN);
  }

  /**
   * 滑动窗口上下文
   * 维护一个固定大小的对话窗口
   */
  async getSlidingWindowContext(
    virtualHumanId: string,
    windowSize: number = 10
  ): Promise<ConversationContext> {
    const messages = await MessageDAO.getChatHistory(virtualHumanId, windowSize);

    const conversationMessages = messages
      .sort((a, b) => a.created_at - b.created_at)
      .map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content,
        timestamp: msg.created_at,
      }));

    const tokenCount = this.estimateTokens(
      conversationMessages.map(m => m.content).join('')
    );

    return {
      messages: conversationMessages,
      tokenCount,
    };
  }

  /**
   * 智能上下文选择
   * 根据当前消息选择最相关的历史消息
   */
  async getRelevantContext(
    virtualHumanId: string,
    currentMessage: string,
    options?: {
      maxMessages?: number;
      similarityThreshold?: number;
    }
  ): Promise<ConversationContext> {
    const maxMessages = options?.maxMessages || 10;
    const threshold = options?.similarityThreshold || 0.3;

    // 1. 获取所有历史消息
    const allMessages = await MessageDAO.getChatHistory(virtualHumanId, 50);

    // 2. 计算每条消息与当前消息的相关性
    const scoredMessages = allMessages.map(msg => ({
      message: msg,
      score: this.calculateMessageRelevance(currentMessage, msg.content),
    }));

    // 3. 过滤并排序
    const relevantMessages = scoredMessages
      .filter(item => item.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxMessages)
      .map(item => item.message)
      .sort((a, b) => a.created_at - b.created_at); // 按时间排序

    const conversationMessages = relevantMessages.map(msg => ({
      role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content,
      timestamp: msg.created_at,
    }));

    const tokenCount = this.estimateTokens(
      conversationMessages.map(m => m.content).join('')
    );

    return {
      messages: conversationMessages,
      tokenCount,
    };
  }

  /**
   * 计算消息相关性
   */
  private calculateMessageRelevance(current: string, historical: string): number {
    const currentWords = new Set(
      current.toLowerCase().split(/\s+/).filter(w => w.length > 1)
    );
    const historicalWords = new Set(
      historical.toLowerCase().split(/\s+/).filter(w => w.length > 1)
    );

    const intersection = new Set(
      [...currentWords].filter(w => historicalWords.has(w))
    );

    if (currentWords.size === 0 || historicalWords.size === 0) {
      return 0;
    }

    return intersection.size / Math.sqrt(currentWords.size * historicalWords.size);
  }

  /**
   * 上下文摘要生成
   * 为长对话生成摘要
   */
  async generateContextSummary(
    virtualHumanId: string
  ): Promise<string> {
    const messages = await MessageDAO.getChatHistory(virtualHumanId, 100);

    if (messages.length === 0) {
      return '暂无对话历史';
    }

    // 统计基本信息
    const userMessages = messages.filter(m => m.role === 'user');
    const aiMessages = messages.filter(m => m.role === 'assistant');

    // 提取主要话题
    const allContent = messages.map(m => m.content).join(' ');
    const topics = this.extractKeyTopics(allContent, 10);

    // 时间跨度
    const sortedByTime = messages.sort((a, b) => a.created_at - b.created_at);
    const firstMessage = new Date(sortedByTime[0].created_at);
    const lastMessage = new Date(sortedByTime[sortedByTime.length - 1].created_at);
    const daysDiff = Math.ceil(
      (lastMessage.getTime() - firstMessage.getTime()) / (1000 * 60 * 60 * 24)
    );

    const summary = `对话统计：
- 总消息数：${messages.length} 条（用户 ${userMessages.length} 条，AI ${aiMessages.length} 条）
- 时间跨度：${daysDiff} 天
- 主要话题：${topics.join('、')}
- 首次对话：${firstMessage.toLocaleDateString()}
- 最近对话：${lastMessage.toLocaleDateString()}`;

    return summary;
  }

  /**
   * 获取上下文统计信息
   */
  async getContextStats(virtualHumanId: string): Promise<{
    totalMessages: number;
    userMessages: number;
    aiMessages: number;
    averageMessageLength: number;
    estimatedTotalTokens: number;
    conversationDays: number;
  }> {
    const messages = await MessageDAO.getChatHistory(virtualHumanId, 1000);

    if (messages.length === 0) {
      return {
        totalMessages: 0,
        userMessages: 0,
        aiMessages: 0,
        averageMessageLength: 0,
        estimatedTotalTokens: 0,
        conversationDays: 0,
      };
    }

    const userMessages = messages.filter(m => m.role === 'user');
    const aiMessages = messages.filter(m => m.role === 'assistant');

    const totalLength = messages.reduce((sum, m) => sum + m.content.length, 0);
    const averageLength = Math.round(totalLength / messages.length);

    const totalTokens = this.estimateTokens(
      messages.map(m => m.content).join('')
    );

    const sortedByTime = messages.sort((a, b) => a.created_at - b.created_at);
    const daysDiff = Math.ceil(
      (sortedByTime[sortedByTime.length - 1].created_at - sortedByTime[0].created_at) /
      (1000 * 60 * 60 * 24)
    );

    return {
      totalMessages: messages.length,
      userMessages: userMessages.length,
      aiMessages: aiMessages.length,
      averageMessageLength: averageLength,
      estimatedTotalTokens: totalTokens,
      conversationDays: daysDiff,
    };
  }
}

export default new ContextManagementService();
