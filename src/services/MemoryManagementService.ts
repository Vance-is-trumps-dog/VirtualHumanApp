/**
 * 记忆管理服务
 * 优化记忆提取、整理和遗忘机制
 */

import { MemoryDAO } from '@database/MemoryDAO';
import { Memory, MemoryCategory } from '@types';
import AIService from './AIService';

export class MemoryManagementService {
  /**
   * 智能记忆提取
   * 根据当前对话内容提取相关记忆
   */
  async retrieveRelevantMemories(
    virtualHumanId: string,
    currentMessage: string,
    options?: {
      limit?: number;
      minRelevanceScore?: number;
      categories?: MemoryCategory[];
    }
  ): Promise<Memory[]> {
    const limit = options?.limit || 5;
    const minScore = options?.minRelevanceScore || 0.3;

    // 1. 关键词提取
    const keywords = await this.extractKeywords(currentMessage);

    // 2. 全文搜索
    const searchResults = await MemoryDAO.searchMemories(
      virtualHumanId,
      keywords.join(' '),
      { limit: limit * 2 }
    );

    // 3. 计算相关性分数
    const scoredMemories = searchResults.map(memory => ({
      memory,
      score: this.calculateRelevanceScore(memory, currentMessage, keywords),
    }));

    // 4. 按分数排序并过滤
    const relevantMemories = scoredMemories
      .filter(item => item.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.memory);

    // 5. 如果按类别过滤
    if (options?.categories && options.categories.length > 0) {
      return relevantMemories.filter(m =>
        options.categories!.includes(m.category)
      );
    }

    return relevantMemories;
  }

  /**
   * 从对话中提取关键词
   */
  private async extractKeywords(text: string): Promise<string[]> {
    // 简单的关键词提取（实际可以用 NLP 库）
    const words = text
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1);

    // 去除停用词
    const stopWords = ['的', '了', '是', '在', '我', '你', '他', '她', '它', '们', '这', '那', '有', '和', '就', '不', '人', '都', '一', '为'];
    return words.filter(w => !stopWords.includes(w));
  }

  /**
   * 计算记忆相关性分数
   */
  private calculateRelevanceScore(
    memory: Memory,
    currentMessage: string,
    keywords: string[]
  ): number {
    let score = 0;

    // 1. 关键词匹配度 (40%)
    const memoryText = (memory.content + ' ' + memory.context).toLowerCase();
    const matchedKeywords = keywords.filter(kw => memoryText.includes(kw));
    const keywordScore = matchedKeywords.length / Math.max(keywords.length, 1);
    score += keywordScore * 0.4;

    // 2. 重要性权重 (30%)
    const importanceScore = memory.importance / 5;
    score += importanceScore * 0.3;

    // 3. 时间衰减 (20%)
    const daysSinceCreated = (Date.now() - memory.created_at) / (1000 * 60 * 60 * 24);
    const timeScore = Math.max(0, 1 - daysSinceCreated / 365); // 一年后衰减到0
    score += timeScore * 0.2;

    // 4. 类别加权 (10%)
    const categoryWeight: Record<MemoryCategory, number> = {
      basic_info: 1.0,
      preferences: 0.9,
      experiences: 0.8,
      relationships: 0.7,
      other: 0.6,
    };
    score += (categoryWeight[memory.category] || 0.6) * 0.1;

    return score;
  }

  /**
   * 从对话中自动提取新记忆
   */
  async extractMemoriesFromConversation(
    virtualHumanId: string,
    userMessage: string,
    aiResponse: string
  ): Promise<Memory[]> {
    try {
      // 使用 AI 分析对话，提取重要信息
      const prompt = `分析以下对话，提取值得记住的信息。对于每条信息，请提供：
1. 记忆内容（简短描述）
2. 类别（basic_info/preferences/experiences/relationships/other）
3. 重要性（1-5）

用户：${userMessage}
AI：${aiResponse}

请以JSON数组格式返回，每项包含：content, category, importance
如果没有需要记住的信息，返回空数组 []`;

      const result = await AIService.chat({
        messages: [
          { role: 'system', content: '你是一个记忆提取助手，擅长从对话中识别重要信息。' },
          { role: 'user', content: prompt },
        ],
        personality: {
          extroversion: 0.5,
          rationality: 0.8,
          seriousness: 0.7,
          openness: 0.5,
          gentleness: 0.5,
        },
      });

      // 解析 AI 返回的 JSON
      const memories = this.parseMemoriesFromAI(result.content);

      // 保存到数据库
      const savedMemories: Memory[] = [];
      for (const memData of memories) {
        const memory = await MemoryDAO.create({
          virtual_human_id: virtualHumanId,
          category: memData.category,
          content: memData.content,
          context: `从对话中提取：用户说"${userMessage.substring(0, 50)}..."`,
          importance: memData.importance,
          tags: this.extractTags(memData.content),
        });
        savedMemories.push(memory);
      }

      return savedMemories;
    } catch (error) {
      console.error('Extract memories error:', error);
      return [];
    }
  }

  /**
   * 解析 AI 返回的记忆数据
   */
  private parseMemoriesFromAI(aiResponse: string): Array<{
    content: string;
    category: MemoryCategory;
    importance: number;
  }> {
    try {
      // 尝试提取 JSON
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return data.filter((item: any) =>
          item.content && item.category && item.importance
        );
      }
      return [];
    } catch (error) {
      console.error('Parse memories error:', error);
      return [];
    }
  }

  /**
   * 从文本提取标签
   */
  private extractTags(text: string): string[] {
    const keywords = text
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1)
      .slice(0, 5);

    return [...new Set(keywords)];
  }

  /**
   * 记忆整理：合并相似记忆
   */
  async consolidateMemories(virtualHumanId: string): Promise<number> {
    const allMemories = await MemoryDAO.getByVirtualHuman(virtualHumanId);

    let consolidated = 0;

    // 按类别分组
    const groupedByCategory = allMemories.reduce((acc, memory) => {
      if (!acc[memory.category]) {
        acc[memory.category] = [];
      }
      acc[memory.category].push(memory);
      return acc;
    }, {} as Record<MemoryCategory, Memory[]>);

    // 对每个类别查找相似记忆
    for (const category in groupedByCategory) {
      const memories = groupedByCategory[category as MemoryCategory];

      for (let i = 0; i < memories.length; i++) {
        for (let j = i + 1; j < memories.length; j++) {
          const similarity = this.calculateSimilarity(
            memories[i].content,
            memories[j].content
          );

          // 如果相似度高于阈值，合并
          if (similarity > 0.8) {
            await this.mergeMemories(memories[i], memories[j]);
            consolidated++;
          }
        }
      }
    }

    return consolidated;
  }

  /**
   * 计算两段文本的相似度
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * 合并两条记忆
   */
  private async mergeMemories(memory1: Memory, memory2: Memory): Promise<void> {
    // 保留重要性更高的记忆，更新其内容
    const primary = memory1.importance >= memory2.importance ? memory1 : memory2;
    const secondary = memory1.importance >= memory2.importance ? memory2 : memory1;

    await MemoryDAO.update(primary.id, {
      content: `${primary.content}；${secondary.content}`,
      importance: Math.max(primary.importance, secondary.importance),
      tags: [...new Set([...primary.tags, ...secondary.tags])],
    });

    // 删除次要记忆
    await MemoryDAO.delete(secondary.id);
  }

  /**
   * 记忆遗忘：删除过期或不重要的记忆
   */
  async forgetIrrelevantMemories(
    virtualHumanId: string,
    options?: {
      maxAge?: number; // 天数
      minImportance?: number;
    }
  ): Promise<number> {
    const maxAge = options?.maxAge || 365; // 默认一年
    const minImportance = options?.minImportance || 2;

    const allMemories = await MemoryDAO.getByVirtualHuman(virtualHumanId);
    const cutoffDate = Date.now() - maxAge * 24 * 60 * 60 * 1000;

    let forgotten = 0;

    for (const memory of allMemories) {
      // 删除条件：时间过久且重要性低
      if (memory.created_at < cutoffDate && memory.importance < minImportance) {
        await MemoryDAO.delete(memory.id);
        forgotten++;
      }
    }

    return forgotten;
  }

  /**
   * 记忆统计
   */
  async getMemoryStats(virtualHumanId: string): Promise<{
    total: number;
    byCategory: Record<MemoryCategory, number>;
    byImportance: Record<number, number>;
    averageImportance: number;
    oldestMemory: Date | null;
    newestMemory: Date | null;
  }> {
    const memories = await MemoryDAO.getByVirtualHuman(virtualHumanId);

    const stats = {
      total: memories.length,
      byCategory: {} as Record<MemoryCategory, number>,
      byImportance: {} as Record<number, number>,
      averageImportance: 0,
      oldestMemory: null as Date | null,
      newestMemory: null as Date | null,
    };

    if (memories.length === 0) {
      return stats;
    }

    // 按类别统计
    memories.forEach(m => {
      stats.byCategory[m.category] = (stats.byCategory[m.category] || 0) + 1;
      stats.byImportance[m.importance] = (stats.byImportance[m.importance] || 0) + 1;
    });

    // 平均重要性
    stats.averageImportance = memories.reduce((sum, m) => sum + m.importance, 0) / memories.length;

    // 最老和最新记忆
    const sortedByDate = memories.sort((a, b) => a.created_at - b.created_at);
    stats.oldestMemory = new Date(sortedByDate[0].created_at);
    stats.newestMemory = new Date(sortedByDate[sortedByDate.length - 1].created_at);

    return stats;
  }
}

export default new MemoryManagementService();
