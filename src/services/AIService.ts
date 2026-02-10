/**
 * AI对话服务
 */

import axios, { AxiosInstance } from 'axios';
import {
  OPENAI_API_KEY as ENV_API_KEY,
  OPENAI_BASE_URL as ENV_BASE_URL,
  OPENAI_MODEL,
} from '@env';
import { Message, Personality, Memory, Emotion, AppError, ErrorCode } from '../types';
import { EMOTION_KEYWORDS } from '../constants';
import ConfigService from './ConfigService';

export class AIService {
  private client: AxiosInstance;
  private model: string;

  constructor() {
    this.model = OPENAI_MODEL || 'gpt-4-turbo';

    // 初始化 Axios 实例
    this.client = axios.create({
      baseURL: ENV_BASE_URL || 'https://api.chatanywhere.com.cn/v1',
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 添加请求拦截器，每次请求前动态获取最新的 API Key 和 BaseURL
    this.client.interceptors.request.use(
      async (config) => {
        try {
          // 1. 优先尝试从 ConfigService 获取动态配置
          let apiKey = ConfigService.getApiKey('openai');

          // 2. 如果没有动态配置，降级使用环境变量
          if (!apiKey) {
            apiKey = ENV_API_KEY;
          }

          // 3. 如果还是没有，抛出错误
          if (!apiKey || apiKey.trim() === '') {
            throw new AppError(
              ErrorCode.CONFIGURATION_ERROR,
              'OpenAI API Key 未配置，请在设置中输入'
            );
          }

          config.headers.Authorization = `Bearer ${apiKey}`;

          // 如果 ConfigService 将来支持配置 BaseURL，也可以在这里动态覆盖 config.baseURL
          return config;
        } catch (error) {
          return Promise.reject(error);
        }
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  async chat(params: {
    messages: Array<{ role: string; content: string }>;
    personality?: Personality;
    memories?: Memory[];
    backgroundStory?: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<{ content: string; emotion: Emotion; tokensUsed: number }> {
    const {
      messages,
      personality,
      memories = [],
      backgroundStory,
      temperature,
      maxTokens
    } = params;

    let apiMessages: Array<{ role: string; content: string }> = [];
    const hasSystemMessage = messages.some(m => m.role === 'system');

    if (hasSystemMessage) {
      apiMessages = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));
    } else if (personality) {
      const systemPrompt = this.buildSystemPrompt(personality, memories, backgroundStory);
      apiMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-10).map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
      ];
    } else {
      apiMessages = messages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));
    }

    try {
      const response = await this.client.post('/chat/completions', {
        model: this.model,
        messages: apiMessages,
        temperature: temperature || 0.8,
        max_tokens: maxTokens || 500,
        presence_penalty: 0.6,
        frequency_penalty: 0.3,
      });

      const content = response.data.choices[0].message.content;
      const tokensUsed = response.data.usage.total_tokens;
      const emotion = this.detectEmotion(content);

      return { content, emotion, tokensUsed };
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  private buildSystemPrompt(
    personality: Personality,
    memories: Memory[],
    backgroundStory?: string
  ): string {
    let prompt = '你是一个虚拟人，请以这个角色的口吻自然对话。\n\n';

    prompt += '## 性格特点\n';
    if (personality.extroversion > 0.6) prompt += '- 外向开朗\n';
    if (personality.rationality > 0.6) prompt += '- 逻辑理性\n';
    if (personality.gentleness > 0.6) prompt += '- 温柔体贴\n';

    if (backgroundStory) {
      prompt += `\n## 背景故事\n${backgroundStory}\n`;
    }

    if (memories.length > 0) {
      prompt += '\n## 记忆\n';
      memories.forEach(m => prompt += `- ${m.value}\n`);
    }

    return prompt;
  }

  detectEmotion(text: string): Emotion {
    for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) return emotion as Emotion;
      }
    }
    return 'neutral';
  }

  private handleError(error: any): void {
    console.error('AI Service Error:', error);
    if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
            throw new AppError(ErrorCode.AI_SERVICE_ERROR, '请求超时，请检查网络');
        }
        if (error.message === 'Network Error') {
            throw new AppError(ErrorCode.NETWORK_ERROR, '网络连接失败，请检查VPN或代理设置');
        }
        const msg = error.response?.data?.error?.message || error.message;
        throw new AppError(ErrorCode.AI_SERVICE_ERROR, `服务请求失败: ${msg}`);
    }
    // 如果是配置错误，直接抛出
    if (error instanceof AppError) {
        throw error;
    }
    throw new AppError(ErrorCode.AI_SERVICE_ERROR, String(error));
  }
}

export default new AIService();
