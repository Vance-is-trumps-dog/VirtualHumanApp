/**
 * AI对话服务
 */

import axios, { AxiosInstance } from 'axios';
import {
  OPENAI_API_KEY,
  OPENAI_BASE_URL,
  OPENAI_MODEL,
  API_TIMEOUT,
  MAX_TOKENS,
  TEMPERATURE,
} from '@env';
import { Message, Personality, Memory, Emotion, AppError, ErrorCode } from '@types';
import { EMOTION_KEYWORDS } from '@constants';

export class AIService {
  private client: AxiosInstance;
  private apiKey: string;
  private model: string;

  constructor() {
    // 验证API密钥
    const apiKey = OPENAI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      throw new AppError(
        ErrorCode.CONFIGURATION_ERROR,
        'OPENAI_API_KEY is not configured. Please check your .env file.'
      );
    }
    if (apiKey.includes('your-') || apiKey.includes('YOUR_')) {
      throw new AppError(
        ErrorCode.CONFIGURATION_ERROR,
        'OPENAI_API_KEY contains placeholder value. Please set a valid API key.'
      );
    }

    this.apiKey = apiKey;
    this.model = OPENAI_MODEL || 'gpt-4-turbo';

    this.client = axios.create({
      baseURL: OPENAI_BASE_URL || 'https://api.openai.com/v1',
      timeout: parseInt(API_TIMEOUT) || 30000,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
    });
  }

  /**
   * 聊天对话
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

    // 准备消息列表
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-10).map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    ];

    try {
      const response = await this.client.post('/chat/completions', {
        model: this.model,
        messages: apiMessages,
        temperature: parseFloat(TEMPERATURE) || 0.8,
        max_tokens: parseInt(MAX_TOKENS) || 500,
        presence_penalty: 0.6,
        frequency_penalty: 0.3,
      });

      const content = response.data.choices[0].message.content;
      const tokensUsed = response.data.usage.total_tokens;

      // 检测情绪
      const emotion = this.detectEmotion(content);

      return { content, emotion, tokensUsed };
    } catch (error) {
      this.handleError(error);
      throw error;
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

    if (personality.seriousness > 0.6) {
      prompt += '- 你说话比较严肃认真，注重细节\n';
    } else if (personality.seriousness < 0.4) {
      prompt += '- 你说话轻松幽默，喜欢开玩笑\n';
    }

    if (personality.openness > 0.6) {
      prompt += '- 你思想开放，乐于接受新观点\n';
    } else if (personality.openness < 0.4) {
      prompt += '- 你比较保守传统，谨慎对待新事物\n';
    }

    if (personality.gentleness > 0.6) {
      prompt += '- 你温柔体贴，说话柔和\n';
    } else if (personality.gentleness < 0.4) {
      prompt += '- 你性格强势直接，说话坦率\n';
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
    prompt += '- 根据上下文自然延续话题\n';

    return prompt;
  }

  /**
   * 检测情绪
   */
  detectEmotion(text: string): Emotion {
    // 简单的关键词匹配
    for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
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
      const response = await this.client.post('/chat/completions', {
        model: this.model,
        messages: [
          {
            role: 'system',
            content:
              '你是一个信息提取助手。从用户的话中提取关键信息，如姓名、年龄、喜好、重要日期等。以JSON数组格式返回，每项包含key、value、category字段。category可以是：user_info（用户信息）、preference（喜好）、event（事件）、relationship（关系）、fact（事实）。如果没有关键信息，返回空数组[]。',
          },
          {
            role: 'user',
            content: `从以下文本中提取信息：\n${text}`,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.data.choices[0].message.content);
      return result.memories || [];
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
      const response = await this.client.post('/chat/completions', {
        model: this.model,
        messages: [
          {
            role: 'user',
            content: `根据以下关键词生成一个虚拟人的背景故事（100-200字）：${keywords.join('、')}`,
          },
        ],
        temperature: 0.9,
        max_tokens: 300,
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Generate backstory failed:', error);
      return '';
    }
  }

  /**
   * 错误处理
   */
  private handleError(error: any): void {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 429) {
        throw new AppError(ErrorCode.RATE_LIMIT_EXCEEDED, '请求过于频繁，请稍后再试');
      }
      if (error.response?.status === 401) {
        throw new AppError(ErrorCode.UNAUTHORIZED, 'API密钥无效');
      }
      if (error.code === 'ECONNABORTED') {
        throw new AppError(ErrorCode.AI_SERVICE_ERROR, '请求超时');
      }
    }
    throw new AppError(ErrorCode.AI_SERVICE_ERROR, '对话服务异常');
  }
}

export default new AIService();
