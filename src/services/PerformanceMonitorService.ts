/**
 * 性能监控服务
 * 监控应用性能指标
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PerformanceMetrics {
  apiCalls: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
  };
  rendering: {
    averageFPS: number;
    slowFrames: number;
  };
  memory: {
    currentUsage: number;
    peakUsage: number;
  };
  database: {
    queryCount: number;
    averageQueryTime: number;
    slowQueries: number;
  };
}

export class PerformanceMonitorService {
  private metrics: PerformanceMetrics = {
    apiCalls: {
      total: 0,
      successful: 0,
      failed: 0,
      averageResponseTime: 0,
    },
    rendering: {
      averageFPS: 60,
      slowFrames: 0,
    },
    memory: {
      currentUsage: 0,
      peakUsage: 0,
    },
    database: {
      queryCount: 0,
      averageQueryTime: 0,
      slowQueries: 0,
    },
  };

  private apiResponseTimes: number[] = [];
  private dbQueryTimes: number[] = [];

  /**
   * 记录 API 调用
   */
  recordAPICall(success: boolean, responseTime: number): void {
    this.metrics.apiCalls.total++;

    if (success) {
      this.metrics.apiCalls.successful++;
    } else {
      this.metrics.apiCalls.failed++;
    }

    this.apiResponseTimes.push(responseTime);

    // 只保留最近100次的数据
    if (this.apiResponseTimes.length > 100) {
      this.apiResponseTimes.shift();
    }

    // 计算平均响应时间
    this.metrics.apiCalls.averageResponseTime =
      this.apiResponseTimes.reduce((sum, time) => sum + time, 0) /
      this.apiResponseTimes.length;
  }

  /**
   * 记录数据库查询
   */
  recordDatabaseQuery(queryTime: number): void {
    this.metrics.database.queryCount++;
    this.dbQueryTimes.push(queryTime);

    // 只保留最近100次的数据
    if (this.dbQueryTimes.length > 100) {
      this.dbQueryTimes.shift();
    }

    // 计算平均查询时间
    this.metrics.database.averageQueryTime =
      this.dbQueryTimes.reduce((sum, time) => sum + time, 0) /
      this.dbQueryTimes.length;

    // 记录慢查询（>100ms）
    if (queryTime > 100) {
      this.metrics.database.slowQueries++;
    }
  }

  /**
   * 记录渲染性能
   */
  recordFrameRate(fps: number): void {
    // 简单的移动平均
    this.metrics.rendering.averageFPS =
      (this.metrics.rendering.averageFPS * 0.9 + fps * 0.1);

    // 记录慢帧（<30 FPS）
    if (fps < 30) {
      this.metrics.rendering.slowFrames++;
    }
  }

  /**
   * 记录内存使用
   */
  recordMemoryUsage(usage: number): void {
    this.metrics.memory.currentUsage = usage;

    if (usage > this.metrics.memory.peakUsage) {
      this.metrics.memory.peakUsage = usage;
    }
  }

  /**
   * 获取性能指标
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * 重置指标
   */
  resetMetrics(): void {
    this.metrics = {
      apiCalls: {
        total: 0,
        successful: 0,
        failed: 0,
        averageResponseTime: 0,
      },
      rendering: {
        averageFPS: 60,
        slowFrames: 0,
      },
      memory: {
        currentUsage: 0,
        peakUsage: 0,
      },
      database: {
        queryCount: 0,
        averageQueryTime: 0,
        slowQueries: 0,
      },
    };

    this.apiResponseTimes = [];
    this.dbQueryTimes = [];
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport(): string {
    const metrics = this.getMetrics();

    let report = '=== 性能报告 ===\n\n';

    // API 性能
    report += '【API 调用】\n';
    report += `总调用次数: ${metrics.apiCalls.total}\n`;
    report += `成功: ${metrics.apiCalls.successful}\n`;
    report += `失败: ${metrics.apiCalls.failed}\n`;
    report += `成功率: ${((metrics.apiCalls.successful / metrics.apiCalls.total) * 100).toFixed(1)}%\n`;
    report += `平均响应时间: ${metrics.apiCalls.averageResponseTime.toFixed(0)}ms\n\n`;

    // 数据库性能
    report += '【数据库】\n';
    report += `查询次数: ${metrics.database.queryCount}\n`;
    report += `平均查询时间: ${metrics.database.averageQueryTime.toFixed(0)}ms\n`;
    report += `慢查询: ${metrics.database.slowQueries}\n\n`;

    // 渲染性能
    report += '【渲染】\n';
    report += `平均帧率: ${metrics.rendering.averageFPS.toFixed(1)} FPS\n`;
    report += `慢帧数: ${metrics.rendering.slowFrames}\n\n`;

    // 内存
    report += '【内存】\n';
    report += `当前使用: ${(metrics.memory.currentUsage / 1024 / 1024).toFixed(1)} MB\n`;
    report += `峰值使用: ${(metrics.memory.peakUsage / 1024 / 1024).toFixed(1)} MB\n`;

    return report;
  }

  /**
   * 保存性能报告到存储
   */
  async saveReport(): Promise<void> {
    const report = this.getPerformanceReport();
    const timestamp = Date.now();

    try {
      await AsyncStorage.setItem(
        `performance_report_${timestamp}`,
        report
      );
    } catch (error) {
      console.error('Save performance report error:', error);
    }
  }

  /**
   * 性能警告检查
   */
  checkPerformanceWarnings(): string[] {
    const warnings: string[] = [];
    const metrics = this.getMetrics();

    // API 警告
    if (metrics.apiCalls.total > 0) {
      const failureRate = metrics.apiCalls.failed / metrics.apiCalls.total;
      if (failureRate > 0.1) {
        warnings.push(`API 失败率过高: ${(failureRate * 100).toFixed(1)}%`);
      }

      if (metrics.apiCalls.averageResponseTime > 3000) {
        warnings.push(`API 平均响应时间过长: ${metrics.apiCalls.averageResponseTime.toFixed(0)}ms`);
      }
    }

    // 数据库警告
    if (metrics.database.averageQueryTime > 50) {
      warnings.push(`数据库平均查询时间过长: ${metrics.database.averageQueryTime.toFixed(0)}ms`);
    }

    if (metrics.database.slowQueries > 10) {
      warnings.push(`慢查询过多: ${metrics.database.slowQueries} 次`);
    }

    // 渲染警告
    if (metrics.rendering.averageFPS < 50) {
      warnings.push(`平均帧率过低: ${metrics.rendering.averageFPS.toFixed(1)} FPS`);
    }

    if (metrics.rendering.slowFrames > 100) {
      warnings.push(`慢帧过多: ${metrics.rendering.slowFrames} 次`);
    }

    // 内存警告
    if (metrics.memory.currentUsage > 200 * 1024 * 1024) {
      warnings.push(`内存使用过高: ${(metrics.memory.currentUsage / 1024 / 1024).toFixed(1)} MB`);
    }

    return warnings;
  }
}

export default new PerformanceMonitorService();
