/**
 * 数据库服务
 * 负责本地数据的存储和管理
 */

// 定义简单的内存存储结构
interface InMemoryTables {
  virtual_humans: any[];
  messages: any[];
  memories: any[];
}

class DatabaseService {
  private initialized = false;
  // 内存数据库，用于临时存储数据
  private memoryDb: InMemoryTables = {
    virtual_humans: [],
    messages: [],
    memories: []
  };

  /**
   * 初始化数据库连接
   */
  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      console.log('Initializing database...');
      // 模拟初始化耗时
      await new Promise(resolve => setTimeout(resolve, 500));

      this.initialized = true;
      console.log('Database initialized successfully (InMemory Mode)');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * 执行 SQL 查询（模拟实现）
   * 注意：这是一个非常基础的 Mock，只支持简单的 INSERT, SELECT, UPDATE, DELETE
   */
  async executeSql<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    const sqlLower = sql.trim().toLowerCase();
    console.log(`[MockDB] Executing: ${sql.substring(0, 50)}...`, params);

    try {
      // 1. 模拟 INSERT
      if (sqlLower.startsWith('insert into')) {
        return this.handleInsert(sql, params) as any;
      }

      // 2. 模拟 SELECT
      if (sqlLower.startsWith('select')) {
        return this.handleSelect<T>(sql, params);
      }

      // 3. 模拟 UPDATE
      if (sqlLower.startsWith('update')) {
        return this.handleUpdate(sql, params) as any;
      }

      // 4. 模拟 DELETE
      if (sqlLower.startsWith('delete')) {
        return this.handleDelete(sql, params) as any;
      }

      return [] as T[];
    } catch (error) {
      console.error('[MockDB] SQL Execution Error:', error);
      throw error;
    }
  }

  // --- 简单的 SQL 模拟处理器 ---

  private handleInsert(sql: string, params: any[]): any[] {
    // 简单解析表名：INSERT INTO table_name ...
    const match = /insert into\s+(\w+)/i.exec(sql);
    if (!match) throw new Error('Invalid INSERT syntax');

    const tableName = match[1] as keyof InMemoryTables;
    if (!this.memoryDb[tableName]) {
      // 如果表不存在，动态创建（虽然这不符合 SQL 规范，但适合 Mock）
      (this.memoryDb as any)[tableName] = [];
    }

    // 假设 params 顺序对应列顺序，这里简化处理，直接存对象
    // 在 VirtualHumanDAO 中，我们知道它是按特定顺序传入的
    // 为了让 Mock 能用，我们需要根据具体的 DAO 逻辑来适配，或者构建一个通用的对象映射
    // 这里采用一种取巧的方法：直接根据参数构建一个对象
    // 注意：这高度依赖于 DAO 的调用方式

    let record: any = {};

    // 针对 virtual_humans 表的特殊处理
    if (tableName === 'virtual_humans') {
      const getParam = (index: number) => params[index] !== undefined ? params[index] : null;

      record = {
        id: getParam(0),
        name: getParam(1),
        age: getParam(2),
        gender: getParam(3),
        occupation: getParam(4),
        avatar_url: getParam(5),
        model_id: getParam(6),
        voice_id: getParam(7),
        outfit_id: getParam(8),
        personality: getParam(9),
        background_story: getParam(10),
        template_id: getParam(11),
        is_template: getParam(12),
        total_conversations: getParam(13),
        total_messages: getParam(14),
        total_duration: getParam(15),
        created_at: getParam(16),
        updated_at: getParam(17),
        status: getParam(18)
      };

      console.log('[MockDB] Inserting virtual_human:', record.id, record.name);
      this.memoryDb.virtual_humans.push(record);
    }
    // 针对 chat_messages 表
    else if (tableName === 'chat_messages') {
      const getParam = (index: number) => params[index] !== undefined ? params[index] : null;

      record = {
        id: getParam(0),
        virtual_human_id: getParam(1),
        conversation_id: getParam(2),
        role: getParam(3),
        content: getParam(4),
        mode: getParam(5),
        audio_url: getParam(6),
        audio_duration: getParam(7),
        emotion: getParam(8),
        tokens_used: getParam(9),
        response_time: getParam(10),
        timestamp: getParam(11),
        is_important: getParam(12),
        is_deleted: getParam(13)
      };

      // 确保存储表存在
      if (!this.memoryDb['chat_messages' as keyof InMemoryTables]) {
        (this.memoryDb as any)['chat_messages'] = [];
      }
      (this.memoryDb as any)['chat_messages'].push(record);
      console.log('[MockDB] Inserted message:', record.id);
    }
    // 针对 memories 表
    else if (tableName === 'memories') {
      const getParam = (index: number) => params[index] !== undefined ? params[index] : null;

      record = {
        id: getParam(0),
        virtual_human_id: getParam(1),
        category: getParam(2),
        key: getParam(3),
        value: getParam(4),
        importance: getParam(5),
        source_message_id: getParam(6),
        created_at: getParam(7),
        access_count: getParam(8),
        expires_at: getParam(9),
        last_accessed: null
      };

      if (!this.memoryDb['memories' as keyof InMemoryTables]) {
        (this.memoryDb as any)['memories'] = [];
      }
      (this.memoryDb as any)['memories'].push(record);
      console.log('[MockDB] Inserted memory:', record.id);
    }

    return [];
  }

  private handleSelect<T>(sql: string, params: any[]): T[] {
    const match = /select .* from\s+(\w+)/i.exec(sql);
    if (!match) return [];

    const tableName = match[1] as keyof InMemoryTables;
    // 处理表名可能包含 chat_messages 的情况（我们的接口定义里叫 messages，但 SQL 里叫 chat_messages）
    const dbKey = tableName === 'chat_messages' ? 'chat_messages' : tableName;

    // 动态获取表，如果不存在则初始化为空数组
    let table = (this.memoryDb as any)[dbKey] || [];

    // --- 简单的 WHERE 处理 ---
    let filtered = [...table];
    const sqlLower = sql.toLowerCase();

    // 1. 按 ID 查询
    if (sqlLower.includes('where id = ?')) {
      const id = params[0];
      filtered = filtered.filter(row => row.id === id);
    }
    // 2. 按 virtual_human_id 查询 (常见于消息和记忆)
    else if (sqlLower.includes('virtual_human_id = ?')) {
      const vId = params[0];
      filtered = filtered.filter(row => row.virtual_human_id === vId);

      // 附加条件：未删除的消息
      if (sqlLower.includes('is_deleted = 0')) {
        filtered = filtered.filter(row => row.is_deleted === 0);
      }
    }
    // 3. 按 status 查询 (虚拟人列表)
    else if (sqlLower.includes('status = ?')) {
      const status = params[0];
      filtered = filtered.filter(row => row.status === status);
    }

    // --- 简单的 LIKE 搜索 (用于记忆检索) ---
    if (sqlLower.includes('like ?')) {
        const likeParam = params.find((p: any) => typeof p === 'string' && p.includes('%'));
        if (likeParam) {
            const keyword = likeParam.replace(/%/g, '').toLowerCase();
            filtered = filtered.filter(row =>
                (row.content && row.content.toLowerCase().includes(keyword)) ||
                (row.key && row.key.toLowerCase().includes(keyword)) ||
                (row.value && row.value.toLowerCase().includes(keyword))
            );
        }
    }

    // --- 简单的 ORDER BY 处理 ---
    if (sqlLower.includes('order by')) {
        if (sqlLower.includes('timestamp desc') || sqlLower.includes('created_at desc')) {
            filtered.sort((a, b) => (b.timestamp || b.created_at || 0) - (a.timestamp || a.created_at || 0));
        } else if (sqlLower.includes('importance desc')) {
            filtered.sort((a, b) => (b.importance || 0) - (a.importance || 0));
        }
    }

    // --- 简单的 LIMIT / OFFSET 处理 ---
    // 提取 LIMIT ?
    if (sqlLower.includes('limit ?')) {
        // 通常 LIMIT 是参数列表的倒数第1个或第2个（如果有OFFSET）
        // 这里做一个简单的启发式查找
        let limit = 50;
        let offset = 0;

        // 查找 LIMIT 和 OFFSET 的参数位置
        // 这对于简单的 Mock 来说比较复杂，我们假设最后两个数字参数是 LIMIT 和 OFFSET
        const numberParams = params.filter(p => typeof p === 'number');
        if (numberParams.length > 0) {
            if (sqlLower.includes('offset ?')) {
                limit = numberParams[numberParams.length - 2];
                offset = numberParams[numberParams.length - 1];
            } else {
                limit = numberParams[numberParams.length - 1];
            }
        }

        filtered = filtered.slice(offset, offset + limit);
    }

    return filtered as T[];
  }

  private handleUpdate(sql: string, params: any[]): any[] {
      // UPDATE table SET ... WHERE id = ?
      const id = params[params.length - 1]; // 假设 ID 总是最后一个参数

      const match = /update\s+(\w+)/i.exec(sql);
      if (!match) return [];

      const tableName = match[1] as keyof InMemoryTables;
      const dbKey = tableName === 'chat_messages' ? 'chat_messages' : tableName;
      const table = (this.memoryDb as any)[dbKey];

      if (!table) return [];

      const index = table.findIndex((row: any) => row.id === id);
      if (index !== -1) {
          const row = table[index];

          // 简单的字段更新模拟
          // 我们不解析 SET 子句，而是尝试根据 params 的值推断更新
          // 这种方法不严谨，但对于 updateLastInteraction (time, time, id) 这种场景够用了

          if (sql.includes('last_interaction = ?')) {
              row.last_interaction = params[0];
              row.updated_at = params[1];
          }
          else if (sql.includes('is_deleted = 1')) {
              row.is_deleted = 1;
          }

          console.log(`[MockDB] Updated record ${id} in ${tableName}`);
      }

      return [];
  }

  private handleDelete(sql: string, params: any[]): any[] {
      // DELETE FROM table WHERE id = ?
      const id = params[0];

      const match = /delete from\s+(\w+)/i.exec(sql);
      if (!match) return [];
      const tableName = match[1] as keyof InMemoryTables;

      if (this.memoryDb[tableName]) {
          this.memoryDb[tableName] = this.memoryDb[tableName].filter(row => row.id !== id);
      }

      return [];
  }

  /**
   * 关闭数据库连接
   */
  async close(): Promise<void> {
    if (!this.initialized) return;

    console.log('Closing database connection...');
    this.initialized = false;
  }
}

export default new DatabaseService();
