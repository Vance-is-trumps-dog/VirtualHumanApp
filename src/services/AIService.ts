/**
 * AI对话服务
 */

import { Alert } from 'react-native';
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
    // [修复] 回退到 .tech 域名，因为之前验证它可以连接（报401说明网络通了）
    const forcedBaseURL = 'https://api.chatanywhere.tech/v1';
    console.log('🔌 AIService initialized with forced BaseURL:', forcedBaseURL);

    this.client = axios.create({
      baseURL: forcedBaseURL,
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
      // [新增] 联网自检：先尝试连接百度，确认手机是否有网
      try {
        console.log('🌐 正在检查网络连接 (ping baidu.com)...');
        const ping = await fetch('https://www.baidu.com', { method: 'HEAD' });
        console.log('✅ 网络连接正常，状态码:', ping.status);
      } catch (pingError) {
        console.error('❌ 无法连接互联网:', pingError);
        throw new AppError(ErrorCode.NETWORK_ERROR, '手机无法连接互联网，请检查 Wifi 或数据网络');
      }

      console.log('🚀 正在通过 fetch 发起 AI 请求...');

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

      const response = await fetch('https://api.chatanywhere.com.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: apiMessages,
          temperature: temperature || 0.8,
          max_tokens: maxTokens || 500,
          presence_penalty: 0.6,
          frequency_penalty: 0.3,
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API 请求失败:', response.status, errorText);
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      const tokensUsed = data.usage.total_tokens;
      const emotion = this.detectEmotion(content);

      return { content, emotion, tokensUsed };
    } catch (error: any) {
      console.error('❌ AI Service Error (Fetch):', error);
      Alert.alert('AI请求失败', String(error));
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
    console.group('🚨 AI Service Error Diagnostic Report');

    // [新增] 屏幕弹窗调试信息
    if (axios.isAxiosError(error)) {
        const debugInfo = `URL: ${error.config?.baseURL}${error.config?.url}\nStatus: ${error.response?.status || '无响应'}\nCode: ${error.code || '未知'}\nMsg: ${error.message}`;
        Alert.alert('AI请求失败调试', debugInfo);
    } else {
        Alert.alert('AI请求未知错误', String(error));
    }

    if (axios.isAxiosError(error)) {
        console.log('📍 Request Endpoint:', error.config?.baseURL, error.config?.url);
        console.log('📤 Request Headers:', JSON.stringify(error.config?.headers, null, 2));
        console.log('📦 Request Data:', JSON.stringify(error.config?.data, null, 2));

        if (error.response) {
            console.log('📥 Response Status:', error.response.status);
            console.log('📄 Response Data:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.log('⚠️ No Response Received (Network/Timeout)');
            console.log('Request Object:', error.request);
        } else {
            console.log('❌ Error Message:', error.message);
        }
        console.log('🔧 Full Error Config:', JSON.stringify(error.toJSON(), null, 2));

        if (error.code === 'ECONNABORTED') {
            console.groupEnd();
            throw new AppError(ErrorCode.AI_SERVICE_ERROR, '请求超时，请检查网络');
        }
        if (error.message === 'Network Error') {
            console.groupEnd();
            throw new AppError(ErrorCode.NETWORK_ERROR, '网络连接失败，请检查VPN或代理设置');
        }
        const msg = error.response?.data?.error?.message || error.message;
        console.groupEnd();
        throw new AppError(ErrorCode.AI_SERVICE_ERROR, `服务请求失败: ${msg}`);
    }

    console.error('Unknown Error:', error);
    console.groupEnd();

    // 如果是配置错误，直接抛出
    if (error instanceof AppError) {
        throw error;
    }
    throw new AppError(ErrorCode.AI_SERVICE_ERROR, String(error));
  }
}

export default new AIService();
