/**
 * 输入验证工具
 * 提供类型安全的输入验证功能
 */

import { AppError, ErrorCode, Personality } from '@types';

/**
 * 创建虚拟人输入数据
 */
export interface CreateVirtualHumanInput {
  name: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  occupation?: string;
  backgroundStory: string;
  personality: Personality;
  modelId?: string;
  voiceId?: string;
  outfitId?: string;
  templateId?: string;
}

/**
 * 验证虚拟人创建输入
 */
export function validateCreateVirtualHumanInput(data: unknown): CreateVirtualHumanInput {
  if (!data || typeof data !== 'object') {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      'Invalid input: data must be an object'
    );
  }

  const input = data as Record<string, unknown>;

  // 验证名字
  if (!input.name || typeof input.name !== 'string') {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      'Name is required and must be a string'
    );
  }

  const name = input.name.trim();
  if (name.length === 0) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, 'Name cannot be empty');
  }

  if (name.length > 50) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      'Name must be 50 characters or less'
    );
  }

  // 验证年龄（可选）
  if (input.age !== undefined) {
    if (typeof input.age !== 'number' || input.age < 0 || input.age > 150) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Age must be a number between 0 and 150'
      );
    }
  }

  // 验证性别（可选）
  if (input.gender !== undefined) {
    if (!['male', 'female', 'other'].includes(input.gender as string)) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Gender must be "male", "female", or "other"'
      );
    }
  }

  // 验证职业（可选）
  if (input.occupation !== undefined && typeof input.occupation !== 'string') {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      'Occupation must be a string'
    );
  }

  // 验证背景故事
  if (!input.backgroundStory || typeof input.backgroundStory !== 'string') {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      'Background story is required and must be a string'
    );
  }

  if (input.backgroundStory.length > 2000) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      'Background story must be 2000 characters or less'
    );
  }

  // 验证性格
  if (!input.personality || typeof input.personality !== 'object') {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      'Personality is required and must be an object'
    );
  }

  const personality = validatePersonality(input.personality);

  // 构建验证后的对象
  const validated: CreateVirtualHumanInput = {
    name,
    backgroundStory: input.backgroundStory,
    personality,
  };

  // 添加可选字段
  if (input.age !== undefined) {
    validated.age = input.age as number;
  }

  if (input.gender !== undefined) {
    validated.gender = input.gender as 'male' | 'female' | 'other';
  }

  if (input.occupation !== undefined) {
    validated.occupation = (input.occupation as string).trim();
  }

  if (input.modelId && typeof input.modelId === 'string') {
    validated.modelId = input.modelId;
  }

  if (input.voiceId && typeof input.voiceId === 'string') {
    validated.voiceId = input.voiceId;
  }

  if (input.outfitId && typeof input.outfitId === 'string') {
    validated.outfitId = input.outfitId;
  }

  if (input.templateId && typeof input.templateId === 'string') {
    validated.templateId = input.templateId;
  }

  return validated;
}

/**
 * 验证性格数据
 */
export function validatePersonality(data: unknown): Personality {
  if (!data || typeof data !== 'object') {
    throw new AppError(
      ErrorCode.INVALID_PERSONALITY,
      'Personality must be an object'
    );
  }

  const p = data as Record<string, unknown>;
  const requiredFields = ['extroversion', 'rationality', 'seriousness', 'openness', 'gentleness'];

  for (const field of requiredFields) {
    if (typeof p[field] !== 'number') {
      throw new AppError(
        ErrorCode.INVALID_PERSONALITY,
        `Personality.${field} must be a number`
      );
    }

    const value = p[field] as number;
    if (value < 0 || value > 1) {
      throw new AppError(
        ErrorCode.INVALID_PERSONALITY,
        `Personality.${field} must be between 0 and 1`
      );
    }
  }

  return {
    extroversion: p.extroversion as number,
    rationality: p.rationality as number,
    seriousness: p.seriousness as number,
    openness: p.openness as number,
    gentleness: p.gentleness as number,
  };
}

/**
 * 验证消息内容
 */
export function validateMessageContent(content: unknown): string {
  if (typeof content !== 'string') {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      'Message content must be a string'
    );
  }

  const trimmed = content.trim();

  if (trimmed.length === 0) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      'Message content cannot be empty'
    );
  }

  if (trimmed.length > 5000) {
    throw new AppError(
      ErrorCode.MESSAGE_TOO_LONG,
      'Message content must be 5000 characters or less'
    );
  }

  return trimmed;
}

/**
 * 验证虚拟人ID
 */
export function validateVirtualHumanId(id: unknown): string {
  if (typeof id !== 'string') {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      'Virtual human ID must be a string'
    );
  }

  if (id.trim().length === 0) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      'Virtual human ID cannot be empty'
    );
  }

  return id.trim();
}

/**
 * SQL参数类型（防止SQL注入）
 */
export type SqlParam = string | number | boolean | null | undefined;

/**
 * 验证SQL参数
 */
export function validateSqlParams(params: unknown[]): SqlParam[] {
  return params.map((param, index) => {
    if (
      param !== null &&
      param !== undefined &&
      typeof param !== 'string' &&
      typeof param !== 'number' &&
      typeof param !== 'boolean'
    ) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        `Invalid SQL parameter type at index ${index}: expected string, number, boolean, null, or undefined`
      );
    }
    return param as SqlParam;
  });
}

/**
 * 清理和验证SQL查询（防止多语句注入）
 */
export function sanitizeSqlQuery(sql: string): string {
  const trimmed = sql.trim();

  // 检测多语句注入
  const statements = trimmed.split(';').filter((s) => s.trim().length > 0);

  if (statements.length > 1) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      'Multiple SQL statements are not allowed for security reasons'
    );
  }

  return trimmed;
}
