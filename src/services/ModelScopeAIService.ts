/**
 * 魔搭社区模型集成服务
 * 支持魔搭社区的开源大模型，降低成本并提升本地化能力
 */

import axios from 'axios';
import { AppError, ErrorCode, Message, Personality, Memory, Emotion } from '@types';

/**
 * 魔搭社区支持的模型列表
 */
export const MODELSCOPE_MODELS = {
  // Qwen系列 - 阿里云通义千问
  QWEN_TURBO: 'qwen-turbo',
  QWEN_PLUS: 'qwen-plus',
  QWEN_MAX: 'qwen-max',

  // 其他开源模型
  CHATGLM: 'chatglm3-6b',
  BAICHUAN: 'baichuan2-13b-chat',
};

/**
 * 魔搭社区AI服务（兼容OpenAI接口）
 */
export class ModelScopeAIService {
  private apiKey: string;
  private baseURL: string;
  private model: string;

  constructor() {
    // 支持魔搭社区API密钥
    this.apiKey = process.env.MODELSCOPE_API_KEY || process.env.OPENAI_API_KEY || '';
    this.baseURL = process.env.MODELSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    this.model = process.env.MODELSCOPE_MODEL || MODELSCOPE_MODELS.QWEN_TURBO;

    if (!this.apiKey || this.apiKey.trim() === '') {
      throw new AppError(
        ErrorCode.CONFIGURATION_ERROR,
        'MODELSCOPE_API_KEY or OPENAI_API_KEY is required'
      );
    }
  }

  /**
   * 聊天对话（兼容OpenAI格式）
   */
  async chat(params: {
    messages: Message[];
    personality: Personality;
    memories: Memory[];
    backgroundStory?: string;
  }): Promise<{ content: string; emotion: Emotion; tokensUsed: number }> {
    const { messages, personality, memories, backgroundStory } = params;

    // 构建系统提示词
    const systemPrompt = this.buildSystemPrompt(personality, memories, backgroundStory);

    // 准备消息列表（OpenAI兼容格式）
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-10).map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    ];

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.model,
          messages: apiMessages,
          temperature: 0.8,
          max_tokens: 500,
          top_p: 0.9,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          timeout: 30000,
        }
      );

      const content = response.data.choices[0].message.content;
      const tokensUsed = response.data.usage?.total_tokens || 0;

      // 检测情绪
      const emotion = this.detectEmotion(content);

      return { content, emotion, tokensUsed };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new AppError(ErrorCode.RATE_LIMIT_EXCEEDED, '请求过于频繁，请稍后再试');
        }
        if (error.response?.status === 401) {
          throw new AppError(ErrorCode.UNAUTHORIZED, 'API密钥无效');
        }
      }
      throw new AppError(ErrorCode.AI_SERVICE_ERROR, '对话服务异常');
    }
  }

  /**
   * 构建系统提示词
   */
  private buildSystemPrompt(
    personality: Personality,
    memories: Memory[],
    backgroundStory?: string
  ): string {
    let prompt = '你是一个虚拟人，请以这个角色的口吻自然对话。\n\n';

    // 性格描述
    prompt += '## 性格特点\n';

    if (personality.extroversion > 0.6) {
      prompt += '- 你性格外向开朗，喜欢主动聊天，善于活跃气氛\n';
    } else if (personality.extroversion < 0.4) {
      prompt += '- 你性格内向安静，更倾向于倾听，回复简洁\n';
    }

    if (personality.rationality > 0.6) {
      prompt += '- 你重视逻辑和理性，喜欢分析问题\n';
    } else if (personality.rationality < 0.4) {
      prompt += '- 你注重情感和直觉，善于共情\n';
    }

    // 背景故事
    if (backgroundStory) {
      prompt += `\n## 背景故事\n${backgroundStory}\n`;
    }

    // 记忆信息
    if (memories.length > 0) {
      prompt += '\n## 你记得以下关于用户的信息\n';
      memories.forEach(m => {
        prompt += `- ${m.value}\n`;
      });
    }

    prompt += '\n## 对话要求\n';
    prompt += '- 保持角色一致性，不要说你是AI或虚拟助手\n';
    prompt += '- 用自然、生活化的语言对话\n';
    prompt += '- 适当使用语气词，如"哦"、"嗯"、"呀"等\n';
    prompt += '- 回复不要太长，保持在1-3句话\n';

    return prompt;
  }

  /**
   * 检测情绪
   */
  private detectEmotion(text: string): Emotion {
    // 简单的关键词匹配
    const emotionKeywords = {
      happy: ['开心', '高兴', '哈哈', '😊', '快乐', '愉快'],
      sad: ['难过', '伤心', '😢', '失落', '沮丧'],
      angry: ['生气', '愤怒', '😠', '烦躁'],
      surprised: ['惊讶', '😮', '哇', '没想到'],
      thinking: ['思考', '🤔', '让我想想', '嗯'],
      excited: ['兴奋', '激动', '太好了', '棒'],
    };

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          return emotion as Emotion;
        }
      }
    }

    return 'neutral';
  }

  /**
   * 提取记忆（从对话中提取关键信息）
   */
  async extractMemories(text: string): Promise<Array<{ key: string; value: string; category: string }>> {
    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: '你是一个信息提取助手。从用户的话中提取关键信息，如姓名、年龄、喜好、重要日期等。以JSON数组格式返回，每项包含key、value、category字段。category可以是：user_info（用户信息）、preference（喜好）、event（事件）、relationship（关系）、fact（事实）。如果没有关键信息，返回空数组[]。',
            },
            {
              role: 'user',
              content: `从以下文本中提取信息：\n${text}`,
            },
          ],
          temperature: 0.3,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      const content = response.data.choices[0].message.content;

      // 尝试解析JSON
      try {
        const result = JSON.parse(content);
        return result.memories || result || [];
      } catch {
        return [];
      }
    } catch (error) {
      console.error('Extract memories failed:', error);
      return [];
    }
  }

  /**
   * 生成背景故事
   */
  async generateBackstory(keywords: string[]): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'user',
              content: `根据以下关键词生成一个虚拟人的背景故事（100-200字）：${keywords.join('、')}`,
            },
          ],
          temperature: 0.9,
          max_tokens: 300,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Generate backstory failed:', error);
      return '';
    }
  }

  /**
   * 获取当前使用的模型
   */
  getModel(): string {
    return this.model;
  }

  /**
   * 切换模型
   */
  setModel(model: string): void {
    this.model = model;
  }
}

export default new ModelScopeAIService();
