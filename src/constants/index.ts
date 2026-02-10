/**
 * 应用常量配置
 */

// ==================== 颜色主题 ====================

export const Colors = {
  light: {
    primary: '#6200EE',
    secondary: '#03DAC6',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    error: '#B00020',
    text: '#000000',
    textSecondary: '#757575',
    border: '#E0E0E0',
    success: '#4CAF50',
    warning: '#FF9800',
    info: '#2196F3',
  },
  dark: {
    primary: '#BB86FC',
    secondary: '#03DAC6',
    background: '#121212',
    surface: '#1E1E1E',
    error: '#CF6679',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    border: '#3D3D3D',
    success: '#66BB6A',
    warning: '#FFA726',
    info: '#42A5F5',
  },
};

// ==================== 尺寸 ====================

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// ==================== API配置 ====================

export const API_CONFIG = {
  OPENAI: {
    BASE_URL: 'https://api.openai.com/v1',
    MODELS: {
      GPT4_TURBO: 'gpt-4-turbo',
      GPT4: 'gpt-4',
      GPT35_TURBO: 'gpt-3.5-turbo',
    },
    MAX_TOKENS: 500,
    TEMPERATURE: 0.8,
    TIMEOUT: 30000,
  },
  AZURE_SPEECH: {
    TTS_ENDPOINT: (region: string) =>
      `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
    STT_ENDPOINT: (region: string) =>
      `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`,
    OUTPUT_FORMAT: 'audio-16khz-128kbitrate-mono-mp3',
  },
};

// ==================== 数据库配置 ====================

export const DATABASE_CONFIG = {
  NAME: 'virtual_human_app.db',
  VERSION: 1,
  LOCATION: 'default',
};

// ==================== 预设模板 ====================

export const VIRTUAL_HUMAN_TEMPLATES = [
  {
    id: 'template_1',
    name: '活泼少女',
    description: '开朗阳光，充满活力的女孩',
    thumbnailUrl: { uri: 'https://via.placeholder.com/150' },
    personality: {
      extroversion: 0.8,
      rationality: 0.4,
      seriousness: 0.2,
      openness: 0.7,
      gentleness: 0.8,
    },
    backgroundStory:
      '我是一个热爱生活的女孩，喜欢交朋友、听音乐、看电影。每天都充满好奇心，对新鲜事物充满热情。',
    modelId: 'model_female_1',
    voiceId: 'zh-CN-XiaoxiaoNeural',
    outfitId: 'outfit_casual_1',
    category: 'casual' as const,
  },
  {
    id: 'template_2',
    name: '成熟商务',
    description: '理性专业，值得信赖的职场精英',
    thumbnailUrl: { uri: 'https://via.placeholder.com/150' },
    personality: {
      extroversion: 0.5,
      rationality: 0.8,
      seriousness: 0.7,
      openness: 0.5,
      gentleness: 0.6,
    },
    backgroundStory:
      '我是一名职场人士，注重效率和专业性。善于分析问题，给出合理建议。',
    modelId: 'model_male_1',
    voiceId: 'zh-CN-YunxiNeural',
    outfitId: 'outfit_business_1',
    category: 'business' as const,
  },
  {
    id: 'template_3',
    name: '温柔知己',
    description: '温暖体贴，善于倾听的好朋友',
    thumbnailUrl: { uri: 'https://via.placeholder.com/150' },
    personality: {
      extroversion: 0.4,
      rationality: 0.6,
      seriousness: 0.4,
      openness: 0.8,
      gentleness: 0.9,
    },
    backgroundStory: '我喜欢倾听别人的故事，给予温暖的陪伴。相信每个人都值得被理解和关心。',
    modelId: 'model_female_2',
    voiceId: 'zh-CN-XiaoyiNeural',
    outfitId: 'outfit_casual_2',
    category: 'casual' as const,
  },
];

// ==================== 内置音色 ====================

export const BUILTIN_VOICES = [
  {
    id: 'zh-CN-XiaoxiaoNeural',
    name: 'Xiaoxiao',
    displayName: '晓晓',
    locale: 'zh-CN',
    gender: 'female' as const,
    description: '甜美女声，适合年轻女性角色',
    styles: ['cheerful', 'sad', 'angry', 'fearful'],
  },
  {
    id: 'zh-CN-YunxiNeural',
    name: 'Yunxi',
    displayName: '云希',
    locale: 'zh-CN',
    gender: 'male' as const,
    description: '温和男声，适合成熟男性角色',
    styles: ['cheerful', 'sad', 'angry', 'fearful'],
  },
  {
    id: 'zh-CN-XiaoyiNeural',
    name: 'Xiaoyi',
    displayName: '晓伊',
    locale: 'zh-CN',
    gender: 'female' as const,
    description: '温柔女声，适合温和角色',
    styles: ['gentle', 'cheerful'],
  },
  {
    id: 'zh-CN-YunjianNeural',
    name: 'Yunjian',
    displayName: '云健',
    locale: 'zh-CN',
    gender: 'male' as const,
    description: '活力男声，适合阳光角色',
    styles: ['cheerful', 'excited'],
  },
];

// ==================== 3D模型 ====================

export const BUILTIN_MODELS = [
  {
    id: 'model_female_1',
    name: '年轻女性 A',
    gender: 'female' as const,
    style: 'anime',
    thumbnailUrl: { uri: 'https://via.placeholder.com/150' },
    modelUrl: 'models/female_1.glb',
    polygonCount: 10000,
    hasBlendShapes: true,
  },
  {
    id: 'model_female_2',
    name: '年轻女性 B',
    gender: 'female' as const,
    style: 'realistic',
    thumbnailUrl: { uri: 'https://via.placeholder.com/150' },
    modelUrl: 'models/female_2.glb',
    polygonCount: 15000,
    hasBlendShapes: true,
  },
  {
    id: 'model_male_1',
    name: '成熟男性 A',
    gender: 'male' as const,
    style: 'realistic',
    thumbnailUrl: { uri: 'https://via.placeholder.com/150' },
    modelUrl: 'models/male_1.glb',
    polygonCount: 12000,
    hasBlendShapes: true,
  },
];

// ==================== 服装 ====================

export const BUILTIN_OUTFITS = [
  {
    id: 'outfit_casual_1',
    name: '休闲套装 A',
    category: 'casual' as const,
    season: 'all' as const,
    thumbnailUrl: { uri: 'https://via.placeholder.com/150' },
    colors: ['#FFFFFF', '#4A90E2'],
  },
  {
    id: 'outfit_business_1',
    name: '商务正装',
    category: 'business' as const,
    season: 'all' as const,
    thumbnailUrl: { uri: 'https://via.placeholder.com/150' },
    colors: ['#2C3E50', '#FFFFFF'],
  },
  {
    id: 'outfit_student_1',
    name: '学生制服',
    category: 'student' as const,
    season: 'all' as const,
    thumbnailUrl: { uri: 'https://via.placeholder.com/150' },
    colors: ['#34495E', '#FFFFFF'],
  },
];

// ==================== 聊天配置 ====================

export const CHAT_CONFIG = {
  MAX_MESSAGE_LENGTH: 500,
  MAX_CONTEXT_MESSAGES: 20,
  PAGE_SIZE: 50,
  AUTO_SAVE_INTERVAL: 5000, // 5秒
  TYPING_ANIMATION_SPEED: 50, // 每个字符的延迟（毫秒）
};

// ==================== 记忆配置 ====================

export const MEMORY_CONFIG = {
  MAX_MEMORIES_PER_CATEGORY: 100,
  DEFAULT_IMPORTANCE: 3,
  EXPIRATION_DAYS: 30,
  RETRIEVAL_LIMIT: 10,
};

// ==================== 文件路径 ====================

export const FILE_PATHS = {
  AUDIO: 'audio',
  IMAGES: 'images',
  MODELS: 'models',
  CACHE: 'cache',
  EXPORTS: 'exports',
};

// ==================== 动画配置 ====================

export const ANIMATION = {
  DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
  EASING: {
    IN: 'ease-in',
    OUT: 'ease-out',
    IN_OUT: 'ease-in-out',
  },
};

// ==================== 正则表达式 ====================

export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^1[3-9]\d{9}$/,
  URL: /^https?:\/\/.+/,
};

// ==================== 情绪映射 ====================

export const EMOTION_KEYWORDS = {
  happy: ['开心', '高兴', '快乐', '哈哈', '棒', '好', '喜欢', '爱'],
  sad: ['难过', '伤心', '失落', '哭', '不开心', '郁闷'],
  angry: ['生气', '愤怒', '讨厌', '烦', '气', '可恶'],
  surprised: ['惊讶', '意外', '没想到', '竟然', '天啊'],
  thinking: ['嗯', '想想', '考虑', '思考', '不确定'],
  excited: ['激动', '兴奋', '期待', '太棒了', '哇'],
};

// ==================== 错误消息 ====================

export const ERROR_MESSAGES = {
  NETWORK: '网络连接失败，请检查网络设置',
  TIMEOUT: '请求超时，请稍后重试',
  UNKNOWN: '发生未知错误',
  INVALID_INPUT: '输入内容无效',
  NOT_FOUND: '未找到相关内容',
  PERMISSION_DENIED: '权限被拒绝',
  STORAGE_FULL: '存储空间不足',
};
