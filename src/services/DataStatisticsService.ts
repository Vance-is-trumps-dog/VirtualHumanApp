/**
 * 数据统计服务
 * 提供各种数据统计和分析
 */

import VirtualHumanDAO from '@database/VirtualHumanDAO';
import MessageDAO from '@database/MessageDAO';
import MemoryDAO from '@database/MemoryDAO';
import Database from '@database';
import { Emotion } from '@types';

export interface AppStatistics {
  overview: {
    totalVirtualHumans: number;
    totalMessages: number;
    totalMemories: number;
    totalConversations: number;
    totalTokensUsed: number;
  };
  timeStats: {
    firstInteraction?: Date;
    lastInteraction?: Date;
    activeDays: number;
    averageMessagesPerDay: number;
  };
  topVirtualHumans: Array<{
    id: string;
    name: string;
    messageCount: number;
    lastInteraction: Date;
  }>;
  emotionDistribution: Record<Emotion, number>;
  usageByMode: {
    text: number;
    voice: number;
    video: number;
  };
  memoryByCategory: Record<string, number>;
}

export interface VirtualHumanStatistics {
  basic: {
    id: string;
    name: string;
    createdAt: Date;
    lastInteraction?: Date;
    totalInteractionTime: number; // 毫秒
  };
  messages: {
    total: number;
    userMessages: number;
    aiMessages: number;
    averageLength: number;
    longestMessage: number;
    byMode: {
      text: number;
      voice: number;
      video: number;
    };
    byEmotion: Record<Emotion, number>;
  };
  memories: {
    total: number;
    byCategory: Record<string, number>;
    byImportance: Record<number, number>;
    averageImportance: number;
  };
  engagement: {
    totalDays: number;
    activeDays: number;
    averageMessagesPerDay: number;
    longestStreak: number; // 最长连续对话天数
    currentStreak: number;
  };
  performance: {
    averageResponseTime: number;
    totalTokensUsed: number;
    averageTokensPerMessage: number;
  };
}

export class DataStatisticsService {
  /**
   * 获取应用级统计
   */
  async getAppStatistics(): Promise<AppStatistics> {
    const stats: AppStatistics = {
      overview: {
        totalVirtualHumans: 0,
        totalMessages: 0,
        totalMemories: 0,
        totalConversations: 0,
        totalTokensUsed: 0,
      },
      timeStats: {
        activeDays: 0,
        averageMessagesPerDay: 0,
      },
      topVirtualHumans: [],
      emotionDistribution: {
        neutral: 0,
        happy: 0,
        sad: 0,
        angry: 0,
        surprised: 0,
        thinking: 0,
        excited: 0,
      },
      usageByMode: {
        text: 0,
        voice: 0,
        video: 0,
      },
      memoryByCategory: {},
    };

    try {
      // 1. 基础统计
      const vhResult = await Database.executeSql(
        'SELECT COUNT(*) as count FROM virtual_humans',
        []
      );
      stats.overview.totalVirtualHumans = vhResult.rows.item(0).count;

      const msgResult = await Database.executeSql(
        'SELECT COUNT(*) as count, SUM(tokens_used) as tokens FROM messages',
        []
      );
      stats.overview.totalMessages = msgResult.rows.item(0).count;
      stats.overview.totalTokensUsed = msgResult.rows.item(0).tokens || 0;

      const memResult = await Database.executeSql(
        'SELECT COUNT(*) as count FROM memories',
        []
      );
      stats.overview.totalMemories = memResult.rows.item(0).count;

      // 2. 时间统计
      const timeResult = await Database.executeSql(
        `SELECT
          MIN(created_at) as first,
          MAX(created_at) as last,
          COUNT(DISTINCT DATE(created_at / 1000, 'unixepoch')) as active_days
         FROM messages`,
        []
      );

      if (timeResult.rows.item(0).first) {
        stats.timeStats.firstInteraction = new Date(timeResult.rows.item(0).first);
        stats.timeStats.lastInteraction = new Date(timeResult.rows.item(0).last);
        stats.timeStats.activeDays = timeResult.rows.item(0).active_days;

        const daysDiff = Math.ceil(
          (stats.timeStats.lastInteraction!.getTime() -
            stats.timeStats.firstInteraction!.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        stats.timeStats.averageMessagesPerDay =
          daysDiff > 0 ? stats.overview.totalMessages / daysDiff : 0;
      }

      // 3. Top虚拟人
      const topVHResult = await Database.executeSql(
        `SELECT
          vh.id, vh.name, vh.last_interaction,
          COUNT(m.id) as message_count
         FROM virtual_humans vh
         LEFT JOIN messages m ON m.virtual_human_id = vh.id
         GROUP BY vh.id
         ORDER BY message_count DESC
         LIMIT 5`,
        []
      );

      for (let i = 0; i < topVHResult.rows.length; i++) {
        const row = topVHResult.rows.item(i);
        stats.topVirtualHumans.push({
          id: row.id,
          name: row.name,
          messageCount: row.message_count,
          lastInteraction: new Date(row.last_interaction),
        });
      }

      // 4. 情感分布
      const emotionResult = await Database.executeSql(
        `SELECT emotion, COUNT(*) as count
         FROM messages
         WHERE emotion IS NOT NULL
         GROUP BY emotion`,
        []
      );

      for (let i = 0; i < emotionResult.rows.length; i++) {
        const row = emotionResult.rows.item(i);
        if (row.emotion in stats.emotionDistribution) {
          stats.emotionDistribution[row.emotion as Emotion] = row.count;
        }
      }

      // 5. 使用模式分布
      const modeResult = await Database.executeSql(
        `SELECT mode, COUNT(*) as count
         FROM messages
         GROUP BY mode`,
        []
      );

      for (let i = 0; i < modeResult.rows.length; i++) {
        const row = modeResult.rows.item(i);
        if (row.mode in stats.usageByMode) {
          stats.usageByMode[row.mode as keyof typeof stats.usageByMode] = row.count;
        }
      }

      // 6. 记忆类别分布
      const memoryCategoryResult = await Database.executeSql(
        `SELECT category, COUNT(*) as count
         FROM memories
         GROUP BY category`,
        []
      );

      for (let i = 0; i < memoryCategoryResult.rows.length; i++) {
        const row = memoryCategoryResult.rows.item(i);
        stats.memoryByCategory[row.category] = row.count;
      }
    } catch (error) {
      console.error('Get app statistics error:', error);
    }

    return stats;
  }

  /**
   * 获取单个虚拟人的详细统计
   */
  async getVirtualHumanStatistics(
    virtualHumanId: string
  ): Promise<VirtualHumanStatistics | null> {
    try {
      const virtualHuman = await VirtualHumanDAO.getById(virtualHumanId);
      if (!virtualHuman) {
        return null;
      }

      const stats: VirtualHumanStatistics = {
        basic: {
          id: virtualHuman.id,
          name: virtualHuman.name,
          createdAt: new Date(virtualHuman.created_at),
          lastInteraction: virtualHuman.last_interaction
            ? new Date(virtualHuman.last_interaction)
            : undefined,
          totalInteractionTime: 0,
        },
        messages: {
          total: 0,
          userMessages: 0,
          aiMessages: 0,
          averageLength: 0,
          longestMessage: 0,
          byMode: { text: 0, voice: 0, video: 0 },
          byEmotion: {
            neutral: 0,
            happy: 0,
            sad: 0,
            angry: 0,
            surprised: 0,
            thinking: 0,
            excited: 0,
          },
        },
        memories: {
          total: 0,
          byCategory: {},
          byImportance: {},
          averageImportance: 0,
        },
        engagement: {
          totalDays: 0,
          activeDays: 0,
          averageMessagesPerDay: 0,
          longestStreak: 0,
          currentStreak: 0,
        },
        performance: {
          averageResponseTime: 0,
          totalTokensUsed: 0,
          averageTokensPerMessage: 0,
        },
      };

      // 消息统计
      const messages = await MessageDAO.getChatHistory(virtualHumanId, 10000);

      stats.messages.total = messages.length;
      stats.messages.userMessages = messages.filter((m) => m.role === 'user').length;
      stats.messages.aiMessages = messages.filter((m) => m.role === 'assistant').length;

      if (messages.length > 0) {
        const totalLength = messages.reduce((sum, m) => sum + m.content.length, 0);
        stats.messages.averageLength = Math.round(totalLength / messages.length);
        stats.messages.longestMessage = Math.max(
          ...messages.map((m) => m.content.length)
        );

        // 按模式统计
        messages.forEach((m) => {
          if (m.mode in stats.messages.byMode) {
            stats.messages.byMode[m.mode as keyof typeof stats.messages.byMode]++;
          }
        });

        // 按情感统计
        messages.forEach((m) => {
          if (m.emotion && m.emotion in stats.messages.byEmotion) {
            stats.messages.byEmotion[m.emotion as Emotion]++;
          }
        });

        // 性能统计
        const aiMessages = messages.filter((m) => m.role === 'assistant');
        const totalResponseTime = aiMessages.reduce(
          (sum, m) => sum + (m.responseTime || 0),
          0
        );
        stats.performance.averageResponseTime =
          aiMessages.length > 0 ? totalResponseTime / aiMessages.length : 0;

        const totalTokens = messages.reduce((sum, m) => sum + (m.tokensUsed || 0), 0);
        stats.performance.totalTokensUsed = totalTokens;
        stats.performance.averageTokensPerMessage =
          messages.length > 0 ? totalTokens / messages.length : 0;

        // 互动天数统计
        const sortedMessages = messages.sort((a, b) => a.created_at - b.created_at);
        const firstMessage = sortedMessages[0];
        const lastMessage = sortedMessages[sortedMessages.length - 1];

        stats.engagement.totalDays = Math.ceil(
          (lastMessage.created_at - firstMessage.created_at) / (1000 * 60 * 60 * 24)
        );

        // 活跃天数
        const uniqueDays = new Set(
          messages.map((m) => {
            const date = new Date(m.created_at);
            return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
          })
        );
        stats.engagement.activeDays = uniqueDays.size;

        stats.engagement.averageMessagesPerDay =
          stats.engagement.totalDays > 0
            ? messages.length / stats.engagement.totalDays
            : 0;

        // 计算连续对话天数
        const streaks = this.calculateStreaks(messages);
        stats.engagement.longestStreak = streaks.longest;
        stats.engagement.currentStreak = streaks.current;
      }

      // 记忆统计
      const memories = await MemoryDAO.getAll(virtualHumanId);
      stats.memories.total = memories.length;

      if (memories.length > 0) {
        // 按类别
        memories.forEach((m) => {
          stats.memories.byCategory[m.category] =
            (stats.memories.byCategory[m.category] || 0) + 1;
        });

        // 按重要性
        memories.forEach((m) => {
          stats.memories.byImportance[m.importance] =
            (stats.memories.byImportance[m.importance] || 0) + 1;
        });

        // 平均重要性
        const totalImportance = memories.reduce((sum, m) => sum + m.importance, 0);
        stats.memories.averageImportance = totalImportance / memories.length;
      }

      return stats;
    } catch (error) {
      console.error('Get virtual human statistics error:', error);
      return null;
    }
  }

  /**
   * 计算连续对话天数
   */
  private calculateStreaks(messages: any[]): {
    longest: number;
    current: number;
  } {
    if (messages.length === 0) {
      return { longest: 0, current: 0 };
    }

    // 按日期分组
    const dateSet = new Set(
      messages.map((m) => {
        const date = new Date(m.created_at);
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      })
    );

    const dates = Array.from(dateSet).sort();

    let longestStreak = 1;
    let currentStreak = 1;
    let tempStreak = 1;

    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i - 1]);
      const currDate = new Date(dates[i]);

      const dayDiff = Math.floor(
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (dayDiff === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    // 计算当前连续天数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastDate = new Date(dates[dates.length - 1]);
    lastDate.setHours(0, 0, 0, 0);

    const daysSinceLastMsg = Math.floor(
      (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastMsg <= 1) {
      // 今天或昨天有消息
      currentStreak = tempStreak;
    } else {
      currentStreak = 0;
    }

    return { longest: longestStreak, current: currentStreak };
  }

  /**
   * 生成使用报告
   */
  async generateUsageReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    period: { start: Date; end: Date };
    messages: number;
    memories: number;
    activeVirtualHumans: number;
    tokenUsage: number;
    topEmotions: Array<{ emotion: Emotion; count: number }>;
  }> {
    const report = {
      period: { start: startDate, end: endDate },
      messages: 0,
      memories: 0,
      activeVirtualHumans: 0,
      tokenUsage: 0,
      topEmotions: [] as Array<{ emotion: Emotion; count: number }>,
    };

    try {
      const startTimestamp = startDate.getTime();
      const endTimestamp = endDate.getTime();

      // 消息统计
      const msgResult = await Database.executeSql(
        `SELECT COUNT(*) as count, SUM(tokens_used) as tokens
         FROM messages
         WHERE created_at >= ? AND created_at <= ?`,
        [startTimestamp, endTimestamp]
      );

      report.messages = msgResult.rows.item(0).count;
      report.tokenUsage = msgResult.rows.item(0).tokens || 0;

      // 记忆统计
      const memResult = await Database.executeSql(
        `SELECT COUNT(*) as count
         FROM memories
         WHERE created_at >= ? AND created_at <= ?`,
        [startTimestamp, endTimestamp]
      );

      report.memories = memResult.rows.item(0).count;

      // 活跃虚拟人
      const vhResult = await Database.executeSql(
        `SELECT COUNT(DISTINCT virtual_human_id) as count
         FROM messages
         WHERE created_at >= ? AND created_at <= ?`,
        [startTimestamp, endTimestamp]
      );

      report.activeVirtualHumans = vhResult.rows.item(0).count;

      // Top情感
      const emotionResult = await Database.executeSql(
        `SELECT emotion, COUNT(*) as count
         FROM messages
         WHERE created_at >= ? AND created_at <= ? AND emotion IS NOT NULL
         GROUP BY emotion
         ORDER BY count DESC
         LIMIT 5`,
        [startTimestamp, endTimestamp]
      );

      for (let i = 0; i < emotionResult.rows.length; i++) {
        const row = emotionResult.rows.item(i);
        report.topEmotions.push({
          emotion: row.emotion as Emotion,
          count: row.count,
        });
      }
    } catch (error) {
      console.error('Generate usage report error:', error);
    }

    return report;
  }

  /**
   * 导出统计数据为CSV格式
   */
  async exportStatisticsToCSV(virtualHumanId?: string): Promise<string> {
    try {
      let csv = '';

      if (virtualHumanId) {
        // 导出单个虚拟人统计
        const stats = await this.getVirtualHumanStatistics(virtualHumanId);
        if (!stats) {
          throw new Error('Virtual human not found');
        }

        csv = this.generateVirtualHumanCSV(stats);
      } else {
        // 导出应用统计
        const stats = await this.getAppStatistics();
        csv = this.generateAppCSV(stats);
      }

      return csv;
    } catch (error) {
      console.error('Export statistics to CSV error:', error);
      throw new Error('导出统计失败');
    }
  }

  /**
   * 生成虚拟人统计CSV
   */
  private generateVirtualHumanCSV(stats: VirtualHumanStatistics): string {
    let csv = '指标,值\n';
    csv += `虚拟人名称,${stats.basic.name}\n`;
    csv += `创建时间,${stats.basic.createdAt.toLocaleString()}\n`;
    csv += `总消息数,${stats.messages.total}\n`;
    csv += `用户消息数,${stats.messages.userMessages}\n`;
    csv += `AI消息数,${stats.messages.aiMessages}\n`;
    csv += `平均消息长度,${stats.messages.averageLength}\n`;
    csv += `总记忆数,${stats.memories.total}\n`;
    csv += `活跃天数,${stats.engagement.activeDays}\n`;
    csv += `最长连续天数,${stats.engagement.longestStreak}\n`;
    csv += `平均响应时间(ms),${stats.performance.averageResponseTime.toFixed(0)}\n`;
    csv += `总Token使用,${stats.performance.totalTokensUsed}\n`;

    return csv;
  }

  /**
   * 生成应用统计CSV
   */
  private generateAppCSV(stats: AppStatistics): string {
    let csv = '指标,值\n';
    csv += `总虚拟人数,${stats.overview.totalVirtualHumans}\n`;
    csv += `总消息数,${stats.overview.totalMessages}\n`;
    csv += `总记忆数,${stats.overview.totalMemories}\n`;
    csv += `总Token使用,${stats.overview.totalTokensUsed}\n`;
    csv += `活跃天数,${stats.timeStats.activeDays}\n`;
    csv += `平均每天消息数,${stats.timeStats.averageMessagesPerDay.toFixed(1)}\n`;

    return csv;
  }
}

export default new DataStatisticsService();
