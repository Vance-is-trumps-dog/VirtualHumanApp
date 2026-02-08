/**
 * 应用配置管理服务
 * 集中管理应用配置和功能开关
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface AppConfig {
  // 功能开关
  features: {
    voiceChat: boolean;
    videoChat: boolean;
    photoTo3D: boolean;
    voiceClone: boolean;
    cloudSync: boolean;
    analytics: boolean;
  };

  // API 配置
  api: {
    openaiApiKey: string;
    azureSpeechKey: string;
    azureSpeechRegion: string;
    timeout: number;
    retryAttempts: number;
  };

  // 性能配置
  performance: {
    enableCache: boolean;
    maxCacheSize: number; // MB
    enablePerformanceMonitor: boolean;
    dbPoolSize: number;
  };

  // UI 配置
  ui: {
    theme: 'light' | 'dark' | 'auto';
    language: 'zh-CN' | 'en-US';
    fontSize: 'small' | 'medium' | 'large';
    animationsEnabled: boolean;
  };

  // 数据配置
  data: {
    autoBackup: boolean;
    autoBackupInterval: number; // 小时
    maxBackups: number;
    autoExportLogs: boolean;
  };

  // 隐私配置
  privacy: {
    enableAnalytics: boolean;
    enableCrashReporting: boolean;
    shareUsageData: boolean;
  };

  // 开发者选项
  developer: {
    enableDebugMode: boolean;
    showPerformanceOverlay: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
}

export class ConfigService {
  private config: AppConfig | null = null;
  private readonly CONFIG_KEY = 'app_config';

  // 默认配置
  private readonly DEFAULT_CONFIG: AppConfig = {
    features: {
      voiceChat: true,
      videoChat: true,
      photoTo3D: false, // 需要API密钥
      voiceClone: false, // 需要API密钥
      cloudSync: false, // 未实现
      analytics: false,
    },
    api: {
      openaiApiKey: '',
      azureSpeechKey: '',
      azureSpeechRegion: 'eastus',
      timeout: 30000,
      retryAttempts: 3,
    },
    performance: {
      enableCache: true,
      maxCacheSize: 100,
      enablePerformanceMonitor: __DEV__,
      dbPoolSize: 5,
    },
    ui: {
      theme: 'auto',
      language: 'zh-CN',
      fontSize: 'medium',
      animationsEnabled: true,
    },
    data: {
      autoBackup: true,
      autoBackupInterval: 24,
      maxBackups: 7,
      autoExportLogs: false,
    },
    privacy: {
      enableAnalytics: false,
      enableCrashReporting: true,
      shareUsageData: false,
    },
    developer: {
      enableDebugMode: __DEV__,
      showPerformanceOverlay: false,
      logLevel: __DEV__ ? 'debug' : 'warn',
    },
  };

  /**
   * 初始化配置
   */
  async initialize(): Promise<void> {
    try {
      const configJson = await AsyncStorage.getItem(this.CONFIG_KEY);

      if (configJson) {
        const savedConfig = JSON.parse(configJson);
        // 合并保存的配置和默认配置
        this.config = this.mergeConfig(this.DEFAULT_CONFIG, savedConfig);
      } else {
        this.config = { ...this.DEFAULT_CONFIG };
      }

      // 保存配置（确保新字段被添加）
      await this.save();
    } catch (error) {
      console.error('Initialize config error:', error);
      this.config = { ...this.DEFAULT_CONFIG };
    }
  }

  /**
   * 获取配置
   */
  getConfig(): AppConfig {
    if (!this.config) {
      throw new Error('Config not initialized. Call initialize() first.');
    }
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  async updateConfig(updates: Partial<AppConfig>): Promise<void> {
    if (!this.config) {
      throw new Error('Config not initialized');
    }

    this.config = this.mergeConfig(this.config, updates);
    await this.save();
  }

  /**
   * 获取特定配置项
   */
  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    if (!this.config) {
      throw new Error('Config not initialized');
    }
    return this.config[key];
  }

  /**
   * 设置特定配置项
   */
  async set<K extends keyof AppConfig>(
    key: K,
    value: AppConfig[K]
  ): Promise<void> {
    if (!this.config) {
      throw new Error('Config not initialized');
    }

    this.config[key] = value;
    await this.save();
  }

  /**
   * 检查功能是否启用
   */
  isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
    if (!this.config) {
      return false;
    }
    return this.config.features[feature];
  }

  /**
   * 启用/禁用功能
   */
  async toggleFeature(
    feature: keyof AppConfig['features'],
    enabled: boolean
  ): Promise<void> {
    if (!this.config) {
      throw new Error('Config not initialized');
    }

    this.config.features[feature] = enabled;
    await this.save();
  }

  /**
   * 获取 API 密钥
   */
  getApiKey(service: 'openai' | 'azureSpeech'): string {
    if (!this.config) {
      return '';
    }

    switch (service) {
      case 'openai':
        return this.config.api.openaiApiKey;
      case 'azureSpeech':
        return this.config.api.azureSpeechKey;
      default:
        return '';
    }
  }

  /**
   * 设置 API 密钥
   */
  async setApiKey(
    service: 'openai' | 'azureSpeech',
    key: string
  ): Promise<void> {
    if (!this.config) {
      throw new Error('Config not initialized');
    }

    switch (service) {
      case 'openai':
        this.config.api.openaiApiKey = key;
        break;
      case 'azureSpeech':
        this.config.api.azureSpeechKey = key;
        break;
    }

    await this.save();
  }

  /**
   * 验证配置
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config) {
      return { valid: false, errors: ['配置未初始化'] };
    }

    // 检查必需的 API 密钥
    if (
      this.config.features.voiceChat &&
      !this.config.api.azureSpeechKey
    ) {
      errors.push('启用语音聊天需要 Azure Speech API 密钥');
    }

    if (!this.config.api.openaiApiKey) {
      errors.push('需要 OpenAI API 密钥');
    }

    // 检查性能配置
    if (this.config.performance.maxCacheSize < 10) {
      errors.push('缓存大小不能小于 10MB');
    }

    if (this.config.data.autoBackupInterval < 1) {
      errors.push('自动备份间隔不能小于 1 小时');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 重置为默认配置
   */
  async resetToDefault(): Promise<void> {
    this.config = { ...this.DEFAULT_CONFIG };
    await this.save();
  }

  /**
   * 导出配置
   */
  exportConfig(): string {
    if (!this.config) {
      throw new Error('Config not initialized');
    }

    // 移除敏感信息
    const exportConfig = { ...this.config };
    exportConfig.api = {
      ...exportConfig.api,
      openaiApiKey: '***',
      azureSpeechKey: '***',
    };

    return JSON.stringify(exportConfig, null, 2);
  }

  /**
   * 导入配置
   */
  async importConfig(configJson: string): Promise<void> {
    try {
      const importedConfig = JSON.parse(configJson);
      this.config = this.mergeConfig(this.DEFAULT_CONFIG, importedConfig);
      await this.save();
    } catch (error) {
      throw new Error('导入配置失败: 格式不正确');
    }
  }

  /**
   * 获取平台特定配置
   */
  getPlatformConfig(): {
    platform: string;
    isIOS: boolean;
    isAndroid: boolean;
    osVersion: string;
  } {
    return {
      platform: Platform.OS,
      isIOS: Platform.OS === 'ios',
      isAndroid: Platform.OS === 'android',
      osVersion: Platform.Version.toString(),
    };
  }

  /**
   * 保存配置
   */
  private async save(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.CONFIG_KEY,
        JSON.stringify(this.config)
      );
    } catch (error) {
      console.error('Save config error:', error);
      throw new Error('保存配置失败');
    }
  }

  /**
   * 合并配置（深度合并）
   */
  private mergeConfig(
    base: AppConfig,
    updates: Partial<AppConfig>
  ): AppConfig {
    const merged = { ...base };

    for (const key in updates) {
      if (updates.hasOwnProperty(key)) {
        const updateValue = updates[key as keyof AppConfig];
        if (
          updateValue &&
          typeof updateValue === 'object' &&
          !Array.isArray(updateValue)
        ) {
          merged[key as keyof AppConfig] = {
            ...merged[key as keyof AppConfig],
            ...updateValue,
          } as any;
        } else {
          merged[key as keyof AppConfig] = updateValue as any;
        }
      }
    }

    return merged;
  }

  /**
   * 获取配置摘要
   */
  getConfigSummary(): string {
    if (!this.config) {
      return '配置未初始化';
    }

    const enabledFeatures = Object.entries(this.config.features)
      .filter(([_, enabled]) => enabled)
      .map(([feature]) => feature);

    let summary = '=== 应用配置摘要 ===\n\n';

    summary += `【启用的功能】\n`;
    if (enabledFeatures.length > 0) {
      enabledFeatures.forEach((feature) => {
        summary += `✓ ${feature}\n`;
      });
    } else {
      summary += '无\n';
    }
    summary += '\n';

    summary += `【界面】\n`;
    summary += `主题: ${this.config.ui.theme}\n`;
    summary += `语言: ${this.config.ui.language}\n`;
    summary += `字体大小: ${this.config.ui.fontSize}\n`;
    summary += `动画: ${this.config.ui.animationsEnabled ? '启用' : '禁用'}\n\n`;

    summary += `【数据】\n`;
    summary += `自动备份: ${this.config.data.autoBackup ? '启用' : '禁用'}\n`;
    if (this.config.data.autoBackup) {
      summary += `备份间隔: ${this.config.data.autoBackupInterval} 小时\n`;
      summary += `最大备份数: ${this.config.data.maxBackups}\n`;
    }
    summary += '\n';

    summary += `【性能】\n`;
    summary += `缓存: ${this.config.performance.enableCache ? '启用' : '禁用'}\n`;
    summary += `最大缓存: ${this.config.performance.maxCacheSize} MB\n`;
    summary += `性能监控: ${this.config.performance.enablePerformanceMonitor ? '启用' : '禁用'}\n`;

    return summary;
  }
}

export default new ConfigService();
