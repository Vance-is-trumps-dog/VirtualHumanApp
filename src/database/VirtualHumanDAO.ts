/**
 * 虚拟人数据访问对象
 */

import { v4 as uuidv4 } from 'uuid';
import Database from './index';
import {
  VirtualHuman,
  CreateVirtualHumanRequest,
  AppError,
  ErrorCode,
} from '@types';
import { SqlParam } from '@utils/InputValidator';

/**
 * 数据库行类型（虚拟人表）
 */
interface VirtualHumanRow {
  id: string;
  name: string;
  age: number | null;
  gender: 'male' | 'female' | 'other';
  occupation: string | null;
  avatar_url: string;
  model_id: string;
  voice_id: string;
  outfit_id: string;
  personality: string; // JSON string
  background_story: string | null;
  experiences: string | null; // JSON string
  goals: string | null; // JSON string
  relationships: string | null; // JSON string
  skills: string | null; // JSON string
  template_id: string | null;
  is_template: number; // SQLite boolean (0 or 1)
  total_conversations: number;
  total_messages: number;
  total_duration: number;
  created_at: number;
  updated_at: number;
  last_interaction: number | null;
  status: 'active' | 'archived' | 'draft';
}

export class VirtualHumanDAO {
  /**
   * 创建虚拟人
   */
  async create(data: CreateVirtualHumanRequest): Promise<VirtualHuman> {
    const now = Date.now();
    const id = uuidv4();

    const virtualHuman: VirtualHuman = {
      id,
      name: data.name,
      age: data.age,
      gender: data.gender,
      occupation: data.occupation,
      avatarUrl: '', // 将根据modelId生成
      modelId: data.modelId,
      voiceId: data.voiceId,
      outfitId: data.outfitId,
      personality: data.personality,
      backgroundStory: data.backgroundStory,
      templateId: data.templateId,
      isTemplate: false,
      totalConversations: 0,
      totalMessages: 0,
      totalDuration: 0,
      createdAt: now,
      updatedAt: now,
      status: 'active',
    };

    await Database.executeSql(
      `INSERT INTO virtual_humans (
        id, name, age, gender, occupation, avatar_url, model_id, voice_id, outfit_id,
        personality, background_story, template_id, is_template,
        total_conversations, total_messages, total_duration,
        created_at, updated_at, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        virtualHuman.name,
        virtualHuman.age || null,
        virtualHuman.gender,
        virtualHuman.occupation || null,
        virtualHuman.avatarUrl,
        virtualHuman.modelId,
        virtualHuman.voiceId,
        virtualHuman.outfitId,
        JSON.stringify(virtualHuman.personality),
        virtualHuman.backgroundStory || null,
        virtualHuman.templateId || null,
        virtualHuman.isTemplate ? 1 : 0,
        0,
        0,
        0,
        now,
        now,
        'active',
      ]
    );

    return virtualHuman;
  }

  /**
   * 根据ID获取虚拟人
   */
  async getById(id: string): Promise<VirtualHuman | null> {
    const rows = await Database.executeSql<VirtualHumanRow>(
      'SELECT * FROM virtual_humans WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToVirtualHuman(rows[0]);
  }

  /**
   * 获取所有虚拟人
   */
  async getAll(
    status: 'active' | 'archived' | 'draft' = 'active'
  ): Promise<VirtualHuman[]> {
    const rows = await Database.executeSql<VirtualHumanRow>(
      'SELECT * FROM virtual_humans WHERE status = ? ORDER BY last_interaction DESC, created_at DESC',
      [status]
    );

    return rows.map(row => this.mapRowToVirtualHuman(row));
  }

  /**
   * 更新虚拟人
   */
  async update(id: string, data: Partial<VirtualHuman>): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new AppError(ErrorCode.VIRTUAL_HUMAN_NOT_FOUND, 'Virtual human not found');
    }

    const updates: string[] = [];
    const values: SqlParam[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.age !== undefined) {
      updates.push('age = ?');
      values.push(data.age);
    }
    if (data.personality !== undefined) {
      updates.push('personality = ?');
      values.push(JSON.stringify(data.personality));
    }
    if (data.backgroundStory !== undefined) {
      updates.push('background_story = ?');
      values.push(data.backgroundStory);
    }
    if (data.modelId !== undefined) {
      updates.push('model_id = ?');
      values.push(data.modelId);
    }
    if (data.voiceId !== undefined) {
      updates.push('voice_id = ?');
      values.push(data.voiceId);
    }
    if (data.outfitId !== undefined) {
      updates.push('outfit_id = ?');
      values.push(data.outfitId);
    }

    updates.push('updated_at = ?');
    values.push(Date.now());
    values.push(id);

    await Database.executeSql(
      `UPDATE virtual_humans SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
  }

  /**
   * 删除虚拟人
   */
  async delete(id: string): Promise<void> {
    await Database.executeSql('DELETE FROM virtual_humans WHERE id = ?', [id]);
  }

  /**
   * 更新最后互动时间
   */
  async updateLastInteraction(id: string): Promise<void> {
    await Database.executeSql(
      'UPDATE virtual_humans SET last_interaction = ?, updated_at = ? WHERE id = ?',
      [Date.now(), Date.now(), id]
    );
  }

  /**
   * 增加统计数据
   */
  async incrementStats(
    id: string,
    field: 'totalConversations' | 'totalMessages' | 'totalDuration',
    value: number = 1
  ): Promise<void> {
    const columnMap = {
      totalConversations: 'total_conversations',
      totalMessages: 'total_messages',
      totalDuration: 'total_duration',
    };

    const column = columnMap[field];

    await Database.executeSql(
      `UPDATE virtual_humans SET ${column} = ${column} + ?, updated_at = ? WHERE id = ?`,
      [value, Date.now(), id]
    );
  }

  /**
   * 映射数据库行到对象
   */
  private mapRowToVirtualHuman(row: VirtualHumanRow): VirtualHuman {
    return {
      id: row.id,
      name: row.name,
      age: row.age ?? undefined,
      gender: row.gender,
      occupation: row.occupation ?? undefined,
      avatarUrl: row.avatar_url,
      modelId: row.model_id,
      voiceId: row.voice_id,
      outfitId: row.outfit_id,
      personality: JSON.parse(row.personality),
      backgroundStory: row.background_story ?? undefined,
      experiences: row.experiences ? JSON.parse(row.experiences) : undefined,
      goals: row.goals ? JSON.parse(row.goals) : undefined,
      relationships: row.relationships ? JSON.parse(row.relationships) : undefined,
      skills: row.skills ? JSON.parse(row.skills) : undefined,
      templateId: row.template_id ?? undefined,
      isTemplate: row.is_template === 1,
      totalConversations: row.total_conversations,
      totalMessages: row.total_messages,
      totalDuration: row.total_duration,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastInteraction: row.last_interaction ?? undefined,
      status: row.status,
    };
  }
}

export default new VirtualHumanDAO();
