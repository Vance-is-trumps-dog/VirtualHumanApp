/**
 * 应用程序初始化工具
 * 负责应用启动时的所有初始化工作
 */

import ErrorLogService from '../services/ErrorLogService';
import DatabaseService from '../services/DatabaseService';
import IntelligentConversationManager from '../services/IntelligentConversationManager';

class AppInitializer {
  private initialized = false;

  /**
   * 执行所有初始化任务
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('App already initialized');
      return;
    }

    console.log('Starting app initialization...');

    try {
      // 1. 初始化错误日志服务
      await ErrorLogService.init();
      console.log('✅ ErrorLogService initialized');

      // 2. 初始化数据库
      await DatabaseService.init();
      console.log('✅ DatabaseService initialized');

      // 3. 初始化智能对话管理器 (加载模型配置等)
      // 注意：这里只是预加载配置，不建立实际连接
      try {
        await IntelligentConversationManager.initialize();
        console.log('✅ IntelligentConversationManager initialized');
      } catch (error) {
        console.warn('⚠️ IntelligentConversationManager init warning:', error);
        // 允许此项失败，不阻止应用启动
      }

      this.initialized = true;
      console.log('🚀 App initialization completed successfully');
    } catch (error) {
      console.error('❌ App initialization failed:', error);
      ErrorLogService.fatal('应用初始化失败', error as Error, 'AppInitializer');
      throw error; // 向上传递错误，让 UI 层处理
    }
  }

  /**
   * 清理资源 (应用退出时调用)
   */
  cleanup(): void {
    console.log('Cleaning up app resources...');
    // 这里添加需要清理的资源
    this.initialized = false;
  }
}

export default new AppInitializer();
