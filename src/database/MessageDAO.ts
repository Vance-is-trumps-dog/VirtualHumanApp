/**
 * 消息数据访问对象
 */

import { v4 as uuidv4 } from 'uuid';
import Database from './index';
import { Message, ChatMode, MessageRole, Emotion } from '@types';

/**
 * 数据库行类型（消息表）
 */
interface MessageRow {
  id: string;
  virtual_human_id: string;
  conversation_id: string | null;
  role: MessageRole;
  content: string;
  mode: ChatMode;
  audio_url: string | null;
  audio_duration: number | null;
  emotion: Emotion | null;
  tokens_used: number | null;
  response_time: number | null;
  timestamp: number;
  is_important: number; // SQLite boolean
  is_deleted: number; // SQLite boolean
}

export class MessageDAO {
  /**
   * 创建消息
   */
  async create(data: {
    virtualHumanId: string;
    conversationId?: string;
    role: MessageRole;
    content: string;
    mode: ChatMode;
    audioUrl?: string;
    audioDuration?: number;
    emotion?: Emotion;
    tokensUsed?: number;
    responseTime?: number;
  }): Promise<Message> {
    const id = uuidv4();
    const now = Date.now();

    const message: Message = {
      id,
      virtualHumanId: data.virtualHumanId,
      conversationId: data.conversationId,
      role: data.role,
      content: data.content,
      mode: data.mode,
      audioUrl: data.audioUrl,
      audioDuration: data.audioDuration,
      emotion: data.emotion,
      tokensUsed: data.tokensUsed,
      responseTime: data.responseTime,
      timestamp: now,
      isImportant: false,
      isDeleted: false,
    };

    await Database.executeSql(
      `INSERT INTO chat_messages (
        id, virtual_human_id, conversation_id, role, content, mode,
        audio_url, audio_duration, emotion, tokens_used, response_time,
        timestamp, is_important, is_deleted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.virtualHumanId,
        data.conversationId || null,
        data.role,
        data.content,
        data.mode,
        data.audioUrl || null,
        data.audioDuration || null,
        data.emotion || null,
        data.tokensUsed || null,
        data.responseTime || null,
        now,
        0,
        0,
      ]
    );

    return message;
  }

  /**
   * 获取聊天历史
   */
  async getChatHistory(
    virtualHumanId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Message[]> {
    const rows = await Database.executeSql<MessageRow>(
      `SELECT * FROM chat_messages
       WHERE virtual_human_id = ? AND is_deleted = 0
       ORDER BY timestamp DESC
       LIMIT ? OFFSET ?`,
      [virtualHumanId, limit, offset]
    );

    return rows.map(row => this.mapRowToMessage(row)).reverse();
  }

  /**
   * 获取最近N条消息（用于上下文）
   */
  async getRecentMessages(virtualHumanId: string, count: number = 10): Promise<Message[]> {
    const rows = await Database.executeSql<MessageRow>(
      `SELECT * FROM chat_messages
       WHERE virtual_human_id = ? AND is_deleted = 0
       ORDER BY timestamp DESC
       LIMIT ?`,
      [virtualHumanId, count]
    );

    return rows.map(row => this.mapRowToMessage(row)).reverse();
  }

  /**
   * 搜索消息
   */
  async search(virtualHumanId: string, keyword: string): Promise<Message[]> {
    const rows = await Database.executeSql<MessageRow>(
      `SELECT * FROM chat_messages
       WHERE virtual_human_id = ? AND is_deleted = 0 AND content LIKE ?
       ORDER BY timestamp DESC`,
      [virtualHumanId, `%${keyword}%`]
    );

    return rows.map(row => this.mapRowToMessage(row));
  }

  /**
   * 标记为重要
   */
  async markAsImportant(id: string, important: boolean = true): Promise<void> {
    await Database.executeSql('UPDATE chat_messages SET is_important = ? WHERE id = ?', [
      important ? 1 : 0,
      id,
    ]);
  }

  /**
   * 删除消息（软删除）
   */
  async delete(id: string): Promise<void> {
    await Database.executeSql('UPDATE chat_messages SET is_deleted = 1 WHERE id = ?', [id]);
  }

  /**
   * 清空聊天历史
   */
  async clearHistory(virtualHumanId: string): Promise<void> {
    await Database.executeSql('UPDATE chat_messages SET is_deleted = 1 WHERE virtual_human_id = ?', [
      virtualHumanId,
    ]);
  }

  /**
   * 获取消息统计
   */
  async getStats(virtualHumanId: string): Promise<{
    total: number;
    textCount: number;
    voiceCount: number;
    videoCount: number;
  }> {
    const [result] = await Database.executeSql(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN mode = 'text' THEN 1 ELSE 0 END) as text_count,
        SUM(CASE WHEN mode = 'voice' THEN 1 ELSE 0 END) as voice_count,
        SUM(CASE WHEN mode = 'video' THEN 1 ELSE 0 END) as video_count
       FROM chat_messages
       WHERE virtual_human_id = ? AND is_deleted = 0`,
      [virtualHumanId]
    );

    return {
      total: result.total,
      textCount: result.text_count,
      voiceCount: result.voice_count,
      videoCount: result.video_count,
    };
  }

  /**
   * 映射数据库行到对象
   */
  private mapRowToMessage(row: MessageRow): Message {
    return {
      id: row.id,
      virtualHumanId: row.virtual_human_id,
      conversationId: row.conversation_id ?? undefined,
      role: row.role,
      content: row.content,
      mode: row.mode,
      audioUrl: row.audio_url ?? undefined,
      audioDuration: row.audio_duration ?? undefined,
      emotion: row.emotion ?? undefined,
      tokensUsed: row.tokens_used ?? undefined,
      responseTime: row.response_time ?? undefined,
      timestamp: row.timestamp,
      isImportant: row.is_important === 1,
      isDeleted: row.is_deleted === 1,
    };
  }
}

export default new MessageDAO();
