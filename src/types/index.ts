/**
 * 核心类型定义
 */

// ==================== 虚拟人相关 ====================

export interface Personality {
  extroversion: number;    // 外向程度 0-1
  rationality: number;     // 理性程度 0-1
  seriousness: number;     // 严肃程度 0-1
  openness: number;        // 开放程度 0-1
  gentleness: number;      // 温柔程度 0-1
}

export interface VirtualHuman {
  id: string;
  name: string;
  age?: number;
  gender: 'male' | 'female' | 'other';
  occupation?: string;

  // 外貌
  avatarUrl: string;
  modelId: string;
  voiceId: string;
  outfitId: string;

  // 性格与背景
  personality: Personality;
  backgroundStory?: string;
  experiences?: Experience[];
  goals?: string[];
  relationships?: Relationship[];
  skills?: string[];

  // 元数据
  templateId?: string;
  isTemplate: boolean;

  // 统计
  totalConversations: number;
  totalMessages: number;
  totalDuration: number;  // 秒

  // 时间戳
  createdAt: number;
  updatedAt: number;
  lastInteraction?: number;

  // 状态
  status: 'active' | 'archived' | 'draft';
}

export interface Experience {
  year: number;
  event: string;
  importance: number;  // 1-5
}

export interface Relationship {
  name: string;
  type: 'family' | 'friend' | 'colleague' | 'other';
  intimacy: number;  // 0-1
  description?: string;
}

export interface VirtualHumanTemplate {
  id: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  personality: Personality;
  backgroundStory: string;
  modelId: string;
  voiceId: string;
  outfitId: string;
  category: 'casual' | 'business' | 'creative' | 'other';
}

// ==================== 消息与对话 ====================

export type MessageRole = 'user' | 'assistant' | 'system';
export type ChatMode = 'text' | 'voice' | 'video';
export type Emotion = 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised' | 'thinking' | 'excited';

export interface Message {
  id: string;
  virtualHumanId: string;
  conversationId?: string;
  role: MessageRole;
  content: string;
  mode: ChatMode;

  // 语音相关
  audioUrl?: string;
  audioDuration?: number;

  // 情绪
  emotion?: Emotion;

  // 元数据
  tokensUsed?: number;
  responseTime?: number;

  timestamp: number;
  isImportant: boolean;
  isDeleted: boolean;
}

export interface Conversation {
  id: string;
  virtualHumanId: string;
  title?: string;
  summary?: string;
  messageCount: number;
  duration: number;
  startedAt: number;
  endedAt?: number;
  isActive: boolean;
}

// ==================== 记忆系统 ====================

export type MemoryCategory = 'user_info' | 'preference' | 'event' | 'relationship' | 'fact';

export interface Memory {
  id: string;
  virtualHumanId: string;
  category: MemoryCategory;
  key: string;
  value: string;
  importance: number;  // 1-5
  sourceMessageId?: string;
  createdAt: number;
  lastAccessed?: number;
  accessCount: number;
  expiresAt?: number;
}

// ==================== 素材资源 ====================

export type AssetType = 'model' | 'voice' | 'outfit' | 'background';

export interface Asset {
  id: string;
  type: AssetType;
  name: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  metadata?: Record<string, any>;
  isBuiltin: boolean;
  isDownloaded: boolean;
  createdAt: number;
  fileSize?: number;
  downloadUrl?: string;
}

export interface Voice {
  id: string;
  name: string;
  displayName: string;
  locale: string;
  gender: 'male' | 'female' | 'neutral';
  description?: string;
  previewUrl?: string;
  styles?: string[];
}

export interface Model3D {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  style: string;
  thumbnailUrl: string;
  modelUrl: string;
  polygonCount?: number;
  hasBlendShapes: boolean;
}

export interface Outfit {
  id: string;
  name: string;
  category: 'casual' | 'business' | 'student' | 'special';
  season: 'spring' | 'summer' | 'autumn' | 'winter' | 'all';
  thumbnailUrl: string;
  colors: string[];
}

// ==================== 草稿 ====================

export interface Draft {
  id: string;
  data: Partial<VirtualHuman>;
  step: number;
  totalSteps: number;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
}

// ==================== 设置 ====================

export type SettingCategory = 'api' | 'voice' | 'video' | 'general' | 'privacy';

export type SettingValue = string | number | boolean | object | null;

export interface Setting {
  key: string;
  value: SettingValue;
  category: SettingCategory;
  updatedAt: number;
}

export interface AppSettings {
  // API配置
  apiProvider: 'openai' | 'claude';
  apiModel: string;
  apiKey?: string;

  // 语音设置
  voiceVolume: number;      // 0-1
  voiceSpeed: number;       // 0.5-2.0
  autoPlay: boolean;
  noiseReduction: boolean;

  // 视频设置
  videoQuality: 'low' | 'medium' | 'high';
  frameRate: number;
  powerSaveMode: boolean;

  // 通用设置
  theme: 'light' | 'dark' | 'auto';
  language: string;
  fontSize: number;
  animationEnabled: boolean;

  // 隐私设置
  biometricLock: boolean;
  encryptChatHistory: boolean;
  allowAnalytics: boolean;
}

// ==================== 统计 ====================

export interface Statistics {
  id: number;
  virtualHumanId?: string;
  date: string;  // YYYY-MM-DD
  messageCount: number;
  conversationCount: number;
  totalDuration: number;
  textCount: number;
  voiceCount: number;
  videoCount: number;
  tokensUsed: number;
  apiCalls: number;
}

// ==================== API请求/响应 ====================

export interface CreateVirtualHumanRequest {
  name: string;
  age?: number;
  gender: 'male' | 'female' | 'other';
  occupation?: string;
  personality: Personality;
  backgroundStory?: string;
  modelId: string;
  voiceId: string;
  outfitId: string;
  templateId?: string;
}

export interface SendMessageRequest {
  virtualHumanId: string;
  content: string;
  mode: ChatMode;
  audioData?: ArrayBuffer;
}

export interface SendMessageResponse {
  messageId: string;
  content: string;
  emotion: Emotion;
  audioUrl?: string;
  tokensUsed: number;
  responseTime: number;
}

export interface GetChatHistoryRequest {
  virtualHumanId: string;
  limit?: number;
  offset?: number;
  beforeTimestamp?: number;
}

export interface GetChatHistoryResponse {
  messages: Message[];
  hasMore: boolean;
}

// ==================== 错误 ====================

export enum ErrorCode {
  // 通用错误 (1xxx)
  UNKNOWN_ERROR = 1000,
  INVALID_REQUEST = 1001,
  UNAUTHORIZED = 1002,
  RATE_LIMIT_EXCEEDED = 1003,
  CONFIGURATION_ERROR = 1004,
  VALIDATION_ERROR = 1005,

  // 虚拟人相关 (2xxx)
  VIRTUAL_HUMAN_NOT_FOUND = 2001,
  VIRTUAL_HUMAN_ALREADY_EXISTS = 2002,
  INVALID_PERSONALITY = 2003,

  // 对话相关 (3xxx)
  MESSAGE_TOO_LONG = 3001,
  CONTEXT_LIMIT_EXCEEDED = 3002,
  AI_SERVICE_ERROR = 3003,

  // 语音相关 (4xxx)
  AUDIO_FORMAT_INVALID = 4001,
  STT_ERROR = 4002,
  TTS_ERROR = 4003,
  VOICE_NOT_FOUND = 4004,

  // 资源相关 (5xxx)
  MODEL_NOT_FOUND = 5001,
  OUTFIT_NOT_FOUND = 5002,
  ASSET_DOWNLOAD_FAILED = 5003,

  // 数据相关 (6xxx)
  DATABASE_ERROR = 6001,
  STORAGE_FULL = 6002,
  IMPORT_FAILED = 6003,
  EXPORT_FAILED = 6004,
}

export type ErrorDetails = Record<string, unknown> | string | number | null;

export class AppError extends Error {
  code: ErrorCode;
  details?: ErrorDetails;

  constructor(code: ErrorCode, message: string, details?: ErrorDetails) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;

    // 确保正确的原型链
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * 转换为JSON格式
   */
  toJSON(): { code: ErrorCode; message: string; details?: ErrorDetails } {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

// ==================== Unity桥接 ====================

export type UnityMessageData =
  | { modelId: string }
  | { animationName: string }
  | { errorCode: string; message: string }
  | Record<string, unknown>;

export interface UnityMessage {
  type: 'modelLoaded' | 'animationComplete' | 'error';
  data?: UnityMessageData;
}

export type UnityCommandParams =
  | { modelId: string }
  | { outfitId: string }
  | { animationName: string; loop?: boolean }
  | { emotion: Emotion; intensity?: number }
  | { visemes: number[]; phonemes: string[] }
  | Record<string, unknown>;

export interface UnityCommand {
  type: 'switchModel' | 'changeOutfit' | 'playAnimation' | 'setEmotion' | 'setLipSync';
  params: UnityCommandParams;
}
