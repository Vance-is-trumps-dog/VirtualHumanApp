/**
 * 数据库管理类
 */

import SQLite, { SQLiteDatabase, Transaction } from 'react-native-sqlite-storage';
import { DATABASE_CONFIG } from '@constants';
import { AppError, ErrorCode } from '@types';
import { SqlParam, sanitizeSqlQuery, validateSqlParams } from '@utils/InputValidator';

// 启用调试
SQLite.DEBUG(true);
SQLite.enablePromise(true);

class Database {
  private db: SQLiteDatabase | null = null;
  private initialized = false;

  /**
   * 初始化数据库
   */
  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      this.db = await SQLite.openDatabase({
        name: DATABASE_CONFIG.NAME,
        location: DATABASE_CONFIG.LOCATION,
      });

      await this.createTables();
      await this.seedData();

      this.initialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to initialize database');
    }
  }

  /**
   * 创建表结构
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tables = [
      // 版本表
      `CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY,
        applied_at INTEGER NOT NULL
      )`,

      // 虚拟人表
      `CREATE TABLE IF NOT EXISTS virtual_humans (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        age INTEGER,
        gender TEXT CHECK(gender IN ('male', 'female', 'other')),
        occupation TEXT,
        avatar_url TEXT,
        model_id TEXT NOT NULL,
        voice_id TEXT NOT NULL,
        outfit_id TEXT NOT NULL,
        personality TEXT NOT NULL,
        background_story TEXT,
        experiences TEXT,
        goals TEXT,
        relationships TEXT,
        skills TEXT,
        template_id TEXT,
        is_template BOOLEAN DEFAULT 0,
        total_conversations INTEGER DEFAULT 0,
        total_messages INTEGER DEFAULT 0,
        total_duration INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        last_interaction INTEGER,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'archived', 'draft'))
      )`,

      // 聊天消息表
      `CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        virtual_human_id TEXT NOT NULL,
        conversation_id TEXT,
        role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        mode TEXT NOT NULL CHECK(mode IN ('text', 'voice', 'video')),
        audio_url TEXT,
        audio_duration INTEGER,
        emotion TEXT,
        tokens_used INTEGER,
        response_time INTEGER,
        timestamp INTEGER NOT NULL,
        is_important BOOLEAN DEFAULT 0,
        is_deleted BOOLEAN DEFAULT 0,
        FOREIGN KEY (virtual_human_id) REFERENCES virtual_humans(id) ON DELETE CASCADE
      )`,

      // 记忆表
      `CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        virtual_human_id TEXT NOT NULL,
        category TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        importance INTEGER DEFAULT 3 CHECK(importance BETWEEN 1 AND 5),
        source_message_id TEXT,
        created_at INTEGER NOT NULL,
        last_accessed INTEGER,
        access_count INTEGER DEFAULT 0,
        expires_at INTEGER,
        FOREIGN KEY (virtual_human_id) REFERENCES virtual_humans(id) ON DELETE CASCADE
      )`,

      // 对话会话表
      `CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        virtual_human_id TEXT NOT NULL,
        title TEXT,
        summary TEXT,
        message_count INTEGER DEFAULT 0,
        duration INTEGER DEFAULT 0,
        started_at INTEGER NOT NULL,
        ended_at INTEGER,
        is_active BOOLEAN DEFAULT 1,
        FOREIGN KEY (virtual_human_id) REFERENCES virtual_humans(id) ON DELETE CASCADE
      )`,

      // 草稿表
      `CREATE TABLE IF NOT EXISTS drafts (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        step INTEGER DEFAULT 1,
        total_steps INTEGER DEFAULT 5,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
      )`,

      // 设置表
      `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        category TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )`,

      // 素材表
      `CREATE TABLE IF NOT EXISTS assets (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK(type IN ('model', 'voice', 'outfit', 'background')),
        name TEXT NOT NULL,
        description TEXT,
        url TEXT NOT NULL,
        thumbnail_url TEXT,
        metadata TEXT,
        is_builtin BOOLEAN DEFAULT 0,
        is_downloaded BOOLEAN DEFAULT 1,
        created_at INTEGER NOT NULL,
        file_size INTEGER,
        download_url TEXT
      )`,

      // 统计表
      `CREATE TABLE IF NOT EXISTS statistics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        virtual_human_id TEXT,
        date TEXT NOT NULL,
        message_count INTEGER DEFAULT 0,
        conversation_count INTEGER DEFAULT 0,
        total_duration INTEGER DEFAULT 0,
        text_count INTEGER DEFAULT 0,
        voice_count INTEGER DEFAULT 0,
        video_count INTEGER DEFAULT 0,
        tokens_used INTEGER DEFAULT 0,
        api_calls INTEGER DEFAULT 0,
        UNIQUE(virtual_human_id, date)
      )`,
    ];

    // 创建索引
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_vh_status ON virtual_humans(status)',
      'CREATE INDEX IF NOT EXISTS idx_vh_last_interaction ON virtual_humans(last_interaction DESC)',
      'CREATE INDEX IF NOT EXISTS idx_msg_vh_id ON chat_messages(virtual_human_id)',
      'CREATE INDEX IF NOT EXISTS idx_msg_timestamp ON chat_messages(timestamp DESC)',
      'CREATE INDEX IF NOT EXISTS idx_mem_vh_id ON memories(virtual_human_id)',
      'CREATE INDEX IF NOT EXISTS idx_mem_category ON memories(category)',
      'CREATE INDEX IF NOT EXISTS idx_stat_date ON statistics(date DESC)',
    ];

    // 执行建表
    for (const sql of tables) {
      await this.db.executeSql(sql);
    }

    // 执行建索引
    for (const sql of indexes) {
      await this.db.executeSql(sql);
    }

    // 初始化版本
    await this.db.executeSql(
      'INSERT OR IGNORE INTO schema_version (version, applied_at) VALUES (?, ?)',
      [DATABASE_CONFIG.VERSION, Date.now()]
    );
  }

  /**
   * 插入初始数据
   */
  private async seedData(): Promise<void> {
    if (!this.db) return;

    // 检查是否已有数据
    const [result] = await this.db.executeSql('SELECT COUNT(*) as count FROM settings');
    if (result.rows.item(0).count > 0) {
      return; // 已有数据，跳过
    }

    // 插入默认设置
    const defaultSettings = [
      ['api_provider', '"openai"', 'api'],
      ['api_model', '"gpt-4-turbo"', 'api'],
      ['voice_volume', '0.8', 'voice'],
      ['voice_speed', '1.0', 'voice'],
      ['auto_play', 'true', 'voice'],
      ['video_quality', '"medium"', 'video'],
      ['theme', '"auto"', 'general'],
      ['language', '"zh-CN"', 'general'],
    ];

    for (const [key, value, category] of defaultSettings) {
      await this.db.executeSql(
        'INSERT INTO settings (key, value, category, updated_at) VALUES (?, ?, ?, ?)',
        [key, value, category, Date.now()]
      );
    }

    console.log('Seed data inserted');
  }

  /**
   * 执行SQL查询
   * @param sql SQL查询语句
   * @param params 查询参数（仅支持 string, number, boolean, null, undefined）
   * @returns 查询结果行数组
   */
  async executeSql<T = Record<string, unknown>>(
    sql: string,
    params: SqlParam[] = []
  ): Promise<T[]> {
    if (!this.db) {
      await this.init();
    }

    try {
      // 验证SQL查询（防止SQL注入）
      const sanitizedSql = sanitizeSqlQuery(sql);

      // 验证参数类型（防止注入和类型错误）
      const validatedParams = validateSqlParams(params);

      const [result] = await this.db!.executeSql(sanitizedSql, validatedParams);
      const rows: T[] = [];

      for (let i = 0; i < result.rows.length; i++) {
        rows.push(result.rows.item(i) as T);
      }

      return rows;
    } catch (error) {
      console.error('SQL execution failed:', sql, params, error);

      // 如果是我们的验证错误，直接抛出
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(ErrorCode.DATABASE_ERROR, 'Database query failed', {
        sql: sql.substring(0, 100), // 只记录前100个字符
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 执行事务
   * @param callback 事务回调函数
   */
  async transaction(callback: (tx: Transaction) => Promise<void>): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    try {
      await this.db!.transaction(callback);
    } catch (error) {
      console.error('Transaction failed:', error);

      // 如果是我们的验证错误，直接抛出
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(ErrorCode.DATABASE_ERROR, 'Transaction failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 关闭数据库
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }

  /**
   * 清空数据库（仅用于开发/测试）
   */
  async reset(): Promise<void> {
    if (!this.db) return;

    const tables = [
      'virtual_humans',
      'chat_messages',
      'memories',
      'conversations',
      'drafts',
      'statistics',
    ];

    for (const table of tables) {
      await this.db.executeSql(`DELETE FROM ${table}`);
    }

    await this.seedData();
    console.log('Database reset complete');
  }
}

// 导出单例
export default new Database();
