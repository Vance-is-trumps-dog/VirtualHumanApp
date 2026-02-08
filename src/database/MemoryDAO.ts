/**
 * 记忆数据访问对象
 */

import { v4 as uuidv4 } from 'uuid';
import Database from './index';
import { Memory, MemoryCategory } from '@types';
import { SqlParam } from '@utils/InputValidator';

/**
 * 数据库行类型（记忆表）
 */
interface MemoryRow {
  id: string;
  virtual_human_id: string;
  category: MemoryCategory;
  key: string;
  value: string;
  importance: number;
  source_message_id: string | null;
  created_at: number;
  last_accessed: number | null;
  access_count: number;
  expires_at: number | null;
}

export class MemoryDAO {
  /**
   * 创建记忆
   */
  async create(data: {
    virtualHumanId: string;
    category: MemoryCategory;
    key: string;
    value: string;
    importance?: number;
    sourceMessageId?: string;
    expiresAt?: number;
  }): Promise<Memory> {
    const id = uuidv4();
    const now = Date.now();

    const memory: Memory = {
      id,
      virtualHumanId: data.virtualHumanId,
      category: data.category,
      key: data.key,
      value: data.value,
      importance: data.importance || 3,
      sourceMessageId: data.sourceMessageId,
      createdAt: now,
      accessCount: 0,
      expiresAt: data.expiresAt,
    };

    await Database.executeSql(
      `INSERT INTO memories (
        id, virtual_human_id, category, key, value, importance,
        source_message_id, created_at, access_count, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.virtualHumanId,
        data.category,
        data.key,
        data.value,
        memory.importance,
        data.sourceMessageId || null,
        now,
        0,
        data.expiresAt || null,
      ]
    );

    return memory;
  }

  /**
   * 获取记忆
   */
  async getAll(
    virtualHumanId: string,
    category?: MemoryCategory,
    minImportance?: number
  ): Promise<Memory[]> {
    let sql = `SELECT * FROM memories WHERE virtual_human_id = ? AND (expires_at IS NULL OR expires_at > ?)`;
    const params: SqlParam[] = [virtualHumanId, Date.now()];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (minImportance) {
      sql += ' AND importance >= ?';
      params.push(minImportance);
    }

    sql += ' ORDER BY importance DESC, last_accessed DESC';

    const rows = await Database.executeSql<MemoryRow>(sql, params);
    return rows.map(row => this.mapRowToMemory(row));
  }

  /**
   * 根据关键词检索记忆
   */
  async retrieve(
    virtualHumanId: string,
    query: string,
    limit: number = 10
  ): Promise<Memory[]> {
    const rows = await Database.executeSql<MemoryRow>(
      `SELECT * FROM memories
       WHERE virtual_human_id = ?
       AND (expires_at IS NULL OR expires_at > ?)
       AND (key LIKE ? OR value LIKE ?)
       ORDER BY importance DESC, access_count DESC
       LIMIT ?`,
      [virtualHumanId, Date.now(), `%${query}%`, `%${query}%`, limit]
    );

    // 更新访问时间和次数
    for (const row of rows) {
      await this.incrementAccessCount(row.id);
    }

    return rows.map(row => this.mapRowToMemory(row));
  }

  /**
   * 更新记忆
   */
  async update(id: string, data: Partial<Memory>): Promise<void> {
    const updates: string[] = [];
    const values: SqlParam[] = [];

    if (data.value !== undefined) {
      updates.push('value = ?');
      values.push(data.value);
    }
    if (data.importance !== undefined) {
      updates.push('importance = ?');
      values.push(data.importance);
    }
    if (data.expiresAt !== undefined) {
      updates.push('expires_at = ?');
      values.push(data.expiresAt);
    }

    if (updates.length > 0) {
      values.push(id);
      await Database.executeSql(`UPDATE memories SET ${updates.join(', ')} WHERE id = ?`, values);
    }
  }

  /**
   * 删除记忆
   */
  async delete(id: string): Promise<void> {
    await Database.executeSql('DELETE FROM memories WHERE id = ?', [id]);
  }

  /**
   * 清理过期记忆
   */
  async cleanExpired(): Promise<number> {
    const result = await Database.executeSql(
      'DELETE FROM memories WHERE expires_at IS NOT NULL AND expires_at < ?',
      [Date.now()]
    );
    return result.length;
  }

  /**
   * 增加访问次数
   */
  private async incrementAccessCount(id: string): Promise<void> {
    await Database.executeSql(
      'UPDATE memories SET access_count = access_count + 1, last_accessed = ? WHERE id = ?',
      [Date.now(), id]
    );
  }

  /**
   * 映射数据库行到对象
   */
  private mapRowToMemory(row: MemoryRow): Memory {
    return {
      id: row.id,
      virtualHumanId: row.virtual_human_id,
      category: row.category,
      key: row.key,
      value: row.value,
      importance: row.importance,
      sourceMessageId: row.source_message_id ?? undefined,
      createdAt: row.created_at,
      lastAccessed: row.last_accessed ?? undefined,
      accessCount: row.access_count,
      expiresAt: row.expires_at ?? undefined,
    };
  }
}

export default new MemoryDAO();
