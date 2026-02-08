/**
 * 应用初始化
 * 在应用启动时执行的初始化逻辑
 */

import Database from '@database';
import ConfigService from '@services/ConfigService';
import ErrorLogService from '@services/ErrorLogService';
import PerformanceMonitorService from '@services/PerformanceMonitorService';
import DataBackupService from '@services/DataBackupService';

export class AppInitializer {
  /**
   * 初始化应用
   */
  async initialize(): Promise<void> {
    try {
      console.log('===== 应用初始化开始 =====');

      // 1. 设置全局错误处理
      this.setupErrorHandling();

      // 2. 初始化配置
      await this.initializeConfig();

      // 3. 初始化数据库
      await this.initializeDatabase();

      // 4. 执行自动备份
      await this.performAutoBackup();

      // 5. 性能监控初始化
      this.initializePerformanceMonitor();

      // 6. 加载持久化的日志
      await this.loadPersistedLogs();

      console.log('===== 应用初始化完成 =====');
    } catch (error) {
      console.error('应用初始化失败:', error);
      ErrorLogService.fatal('应用初始化失败', error as Error, 'AppInitializer');
      throw error;
    }
  }

  /**
   * 设置错误处理
   */
  private setupErrorHandling(): void {
    try {
      ErrorLogService.setupGlobalErrorHandler();
      ErrorLogService.info('全局错误处理器已设置', 'AppInitializer');
    } catch (error) {
      console.error('设置错误处理器失败:', error);
    }
  }

  /**
   * 初始化配置
   */
  private async initializeConfig(): Promise<void> {
    try {
      await ConfigService.initialize();

      const config = ConfigService.getConfig();
      ErrorLogService.info('配置初始化完成', 'AppInitializer', {
        features: Object.keys(config.features).filter(
          (key) => config.features[key as keyof typeof config.features]
        ),
      });

      // 验证配置
      const validation = ConfigService.validateConfig();
      if (!validation.valid) {
        ErrorLogService.warn(
          '配置验证发现问题',
          'AppInitializer',
          { errors: validation.errors }
        );
      }
    } catch (error) {
      ErrorLogService.error('配置初始化失败', error as Error, 'AppInitializer');
      throw error;
    }
  }

  /**
   * 初始化数据库
   */
  private async initializeDatabase(): Promise<void> {
    try {
      await Database.init();
      ErrorLogService.info('数据库初始化完成', 'AppInitializer');
    } catch (error) {
      ErrorLogService.fatal('数据库初始化失败', error as Error, 'AppInitializer');
      throw error;
    }
  }

  /**
   * 执行自动备份
   */
  private async performAutoBackup(): Promise<void> {
    try {
      const config = ConfigService.getConfig();

      if (config.data.autoBackup) {
        const backup = await DataBackupService.autoBackup();

        if (backup) {
          ErrorLogService.info(
            '自动备份已创建',
            'AppInitializer',
            {
              backupId: backup.id,
              size: backup.size,
            }
          );
        } else {
          ErrorLogService.debug(
            '跳过自动备份（最近已有备份）',
            'AppInitializer'
          );
        }
      }
    } catch (error) {
      ErrorLogService.warn('自动备份失败', 'AppInitializer', { error });
      // 备份失败不应阻止应用启动
    }
  }

  /**
   * 初始化性能监控
   */
  private initializePerformanceMonitor(): void {
    try {
      const config = ConfigService.getConfig();

      if (config.performance.enablePerformanceMonitor) {
        PerformanceMonitorService.resetMetrics();
        ErrorLogService.info('性能监控已启用', 'AppInitializer');
      }
    } catch (error) {
      ErrorLogService.warn('性能监控初始化失败', 'AppInitializer', { error });
    }
  }

  /**
   * 加载持久化的日志
   */
  private async loadPersistedLogs(): Promise<void> {
    try {
      const logs = await ErrorLogService.loadPersistedLogs();
      ErrorLogService.info(
        '已加载持久化日志',
        'AppInitializer',
        { count: logs.length }
      );
    } catch (error) {
      ErrorLogService.warn('加载持久化日志失败', 'AppInitializer', { error });
    }
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    try {
      console.log('===== 应用清理开始 =====');

      // 1. 保存性能报告
      await this.savePerformanceReport();

      // 2. 保存错误日志
      await this.saveErrorLogs();

      // 3. 关闭数据库
      await Database.close();

      ErrorLogService.info('应用清理完成', 'AppInitializer');
      console.log('===== 应用清理完成 =====');
    } catch (error) {
      console.error('应用清理失败:', error);
    }
  }

  /**
   * 保存性能报告
   */
  private async savePerformanceReport(): Promise<void> {
    try {
      const config = ConfigService.getConfig();

      if (config.performance.enablePerformanceMonitor) {
        await PerformanceMonitorService.saveReport();
        ErrorLogService.info('性能报告已保存', 'AppInitializer');
      }
    } catch (error) {
      ErrorLogService.warn('保存性能报告失败', 'AppInitializer', { error });
    }
  }

  /**
   * 保存错误日志
   */
  private async saveErrorLogs(): Promise<void> {
    try {
      const config = ConfigService.getConfig();

      if (config.data.autoExportLogs) {
        const logStats = ErrorLogService.getLogStatistics();

        if (logStats.byLevel.ERROR > 0 || logStats.byLevel.FATAL > 0) {
          const filePath = await ErrorLogService.exportLogs();
          ErrorLogService.info(
            '错误日志已导出',
            'AppInitializer',
            { filePath }
          );
        }
      }
    } catch (error) {
      ErrorLogService.warn('保存错误日志失败', 'AppInitializer', { error });
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: {
      database: boolean;
      config: boolean;
      performance: boolean;
    };
    warnings: string[];
  }> {
    const result = {
      status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
      checks: {
        database: false,
        config: false,
        performance: false,
      },
      warnings: [] as string[],
    };

    try {
      // 检查数据库
      try {
        await Database.executeSql('SELECT 1', []);
        result.checks.database = true;
      } catch (error) {
        result.warnings.push('数据库连接异常');
      }

      // 检查配置
      try {
        const validation = ConfigService.validateConfig();
        result.checks.config = validation.valid;
        if (!validation.valid) {
          result.warnings.push(...validation.errors);
        }
      } catch (error) {
        result.warnings.push('配置验证失败');
      }

      // 检查性能
      try {
        const perfWarnings = PerformanceMonitorService.checkPerformanceWarnings();
        if (perfWarnings.length > 0) {
          result.warnings.push(...perfWarnings);
        } else {
          result.checks.performance = true;
        }
      } catch (error) {
        result.warnings.push('性能检查失败');
      }

      // 确定整体状态
      const healthyCount = Object.values(result.checks).filter((v) => v).length;

      if (healthyCount === 3) {
        result.status = 'healthy';
      } else if (healthyCount >= 2) {
        result.status = 'degraded';
      } else {
        result.status = 'unhealthy';
      }
    } catch (error) {
      result.status = 'unhealthy';
      result.warnings.push('健康检查执行失败');
    }

    return result;
  }
}

export default new AppInitializer();
