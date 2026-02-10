/**
 * 错误日志服务
 * 统一的错误处理和日志记录
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  context?: string;
  error?: Error;
  metadata?: Record<string, any>;
}

export class ErrorLogService {
  private logs: LogEntry[] = [];
  private readonly MAX_LOGS = 1000;
  private readonly LOG_DIR = `${RNFS.DocumentDirectoryPath}/logs`;
  private readonly LOG_STORAGE_KEY = 'app_logs';

  /**
   * 初始化服务
   */
  async init(): Promise<void> {
    await this.ensureLogDir();
    this.setupGlobalErrorHandler();
  }

  /**
   * 记录日志
   */
  log(
    level: LogLevel,
    message: string,
    context?: string,
    error?: Error,
    metadata?: Record<string, any>
  ): void {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      context,
      error,
      metadata,
    };

    this.logs.push(entry);

    // 保持日志数量限制
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.shift();
    }

    // 在开发环境打印到控制台
    if (__DEV__) {
      this.printToConsole(entry);
    }

    // 自动保存错误日志
    if (level === LogLevel.ERROR || level === LogLevel.FATAL) {
      this.persistLog(entry);
    }
  }

  /**
   * Debug 日志
   */
  debug(message: string, context?: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context, undefined, metadata);
  }

  /**
   * Info 日志
   */
  info(message: string, context?: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context, undefined, metadata);
  }

  /**
   * Warning 日志
   */
  warn(message: string, context?: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context, undefined, metadata);
  }

  /**
   * Error 日志
   */
  error(
    message: string,
    error?: Error,
    context?: string,
    metadata?: Record<string, any>
  ): void {
    this.log(LogLevel.ERROR, message, context, error, metadata);
  }

  /**
   * Fatal 日志
   */
  fatal(
    message: string,
    error?: Error,
    context?: string,
    metadata?: Record<string, any>
  ): void {
    this.log(LogLevel.FATAL, message, context, error, metadata);
  }

  /**
   * 获取所有日志
   */
  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter((log) => log.level === level);
    }
    return [...this.logs];
  }

  /**
   * 清空日志
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * 打印到控制台
   */
  private printToConsole(entry: LogEntry): void {
    const time = new Date(entry.timestamp).toLocaleTimeString();
    const prefix = `[${time}] [${entry.level}]`;
    const message = entry.context
      ? `${prefix} [${entry.context}] ${entry.message}`
      : `${prefix} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.metadata);
        break;
      case LogLevel.INFO:
        console.info(message, entry.metadata);
        break;
      case LogLevel.WARN:
        console.warn(message, entry.metadata);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(message, entry.error, entry.metadata);
        break;
    }
  }

  /**
   * 持久化日志到存储
   */
  private async persistLog(entry: LogEntry): Promise<void> {
    try {
      // 保存到 AsyncStorage（最近的错误）
      const recentErrorsJson = await AsyncStorage.getItem(this.LOG_STORAGE_KEY);
      const recentErrors: LogEntry[] = recentErrorsJson
        ? JSON.parse(recentErrorsJson)
        : [];

      recentErrors.push(entry);

      // 只保留最近100条
      if (recentErrors.length > 100) {
        recentErrors.shift();
      }

      await AsyncStorage.setItem(
        this.LOG_STORAGE_KEY,
        JSON.stringify(recentErrors)
      );
    } catch (error) {
      console.error('Failed to persist log:', error);
    }
  }

  /**
   * 导出日志到文件
   */
  async exportLogs(): Promise<string> {
    try {
      await this.ensureLogDir();

      const timestamp = Date.now();
      const fileName = `log_${timestamp}.txt`;
      const filePath = `${this.LOG_DIR}/${fileName}`;

      let content = `应用日志导出\n`;
      content += `导出时间: ${new Date(timestamp).toLocaleString()}\n`;
      content += `总日志数: ${this.logs.length}\n\n`;
      content += `${'='.repeat(80)}\n\n`;

      this.logs.forEach((entry) => {
        content += this.formatLogEntry(entry);
        content += `\n${'-'.repeat(80)}\n\n`;
      });

      await RNFS.writeFile(filePath, content, 'utf8');

      return filePath;
    } catch (error) {
      console.error('Export logs error:', error);
      throw new Error('导出日志失败');
    }
  }

  /**
   * 格式化日志条目
   */
  private formatLogEntry(entry: LogEntry): string {
    let formatted = '';

    formatted += `时间: ${new Date(entry.timestamp).toLocaleString()}\n`;
    formatted += `级别: ${entry.level}\n`;

    if (entry.context) {
      formatted += `上下文: ${entry.context}\n`;
    }

    formatted += `消息: ${entry.message}\n`;

    if (entry.error) {
      formatted += `错误: ${entry.error.name}: ${entry.error.message}\n`;
      if (entry.error.stack) {
        formatted += `堆栈:\n${entry.error.stack}\n`;
      }
    }

    if (entry.metadata) {
      formatted += `元数据: ${JSON.stringify(entry.metadata, null, 2)}\n`;
    }

    return formatted;
  }

  /**
   * 加载持久化的日志
   */
  async loadPersistedLogs(): Promise<LogEntry[]> {
    try {
      const logsJson = await AsyncStorage.getItem(this.LOG_STORAGE_KEY);
      if (logsJson) {
        return JSON.parse(logsJson);
      }
      return [];
    } catch (error) {
      console.error('Load persisted logs error:', error);
      return [];
    }
  }

  /**
   * 确保日志目录存在
   */
  private async ensureLogDir(): Promise<void> {
    const exists = await RNFS.exists(this.LOG_DIR);
    if (!exists) {
      await RNFS.mkdir(this.LOG_DIR);
    }
  }

  /**
   * 获取日志统计
   */
  getLogStatistics(): {
    total: number;
    byLevel: Record<LogLevel, number>;
    recentErrors: number;
  } {
    const stats = {
      total: this.logs.length,
      byLevel: {
        [LogLevel.DEBUG]: 0,
        [LogLevel.INFO]: 0,
        [LogLevel.WARN]: 0,
        [LogLevel.ERROR]: 0,
        [LogLevel.FATAL]: 0,
      },
      recentErrors: 0,
    };

    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    this.logs.forEach((log) => {
      stats.byLevel[log.level]++;

      if (
        (log.level === LogLevel.ERROR || log.level === LogLevel.FATAL) &&
        log.timestamp > oneHourAgo
      ) {
        stats.recentErrors++;
      }
    });

    return stats;
  }

  /**
   * 生成错误报告
   */
  generateErrorReport(): string {
    const stats = this.getLogStatistics();
    const errors = this.getLogs(LogLevel.ERROR);
    const fatals = this.getLogs(LogLevel.FATAL);

    let report = '=== 错误报告 ===\n\n';

    report += `【统计】\n`;
    report += `总日志数: ${stats.total}\n`;
    report += `错误数: ${stats.byLevel[LogLevel.ERROR]}\n`;
    report += `严重错误: ${stats.byLevel[LogLevel.FATAL]}\n`;
    report += `最近1小时错误: ${stats.recentErrors}\n\n`;

    if (fatals.length > 0) {
      report += `【严重错误】\n`;
      fatals.slice(-5).forEach((log, index) => {
        report += `${index + 1}. [${new Date(log.timestamp).toLocaleString()}] ${log.message}\n`;
        if (log.error) {
          report += `   ${log.error.message}\n`;
        }
      });
      report += '\n';
    }

    if (errors.length > 0) {
      report += `【最近错误】\n`;
      errors.slice(-10).forEach((log, index) => {
        report += `${index + 1}. [${new Date(log.timestamp).toLocaleString()}] ${log.message}\n`;
      });
    }

    return report;
  }

  /**
   * 设置全局错误处理器
   */
  setupGlobalErrorHandler(): void {
    // 捕获未处理的 Promise 拒绝
    const originalPromiseRejection = global.Promise.prototype.catch;
    const self = this; // 保存 this 引用
    global.Promise.prototype.catch = function (onRejected) {
      return originalPromiseRejection.call(this, (error) => {
        self.error(
          'Unhandled Promise Rejection',
          error,
          'Promise'
        );
        if (onRejected) {
          return onRejected(error);
        }
        throw error;
      });
    };

    // 设置全局错误处理器
    if (ErrorUtils) {
      const originalHandler = ErrorUtils.getGlobalHandler();

      ErrorUtils.setGlobalHandler((error, isFatal) => {
        self.fatal(
          isFatal ? 'Fatal Error' : 'Unhandled Error',
          error,
          'Global'
        );

        if (originalHandler) {
          originalHandler(error, isFatal);
        }
      });
    }
  }
}

export default new ErrorLogService();
