# API接口文档

## 概述

本文档定义了虚拟人互动App与外部服务的API接口规范。

---

## 1. AI对话服务 (OpenAI / Claude)

### 1.1 聊天补全接口

**OpenAI API**

```typescript
// Endpoint
POST https://api.openai.com/v1/chat/completions

// Headers
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_API_KEY"
}

// Request Body
{
  "model": "gpt-4-turbo",
  "messages": [
    {
      "role": "system",
      "content": "你是一个虚拟人，名叫小美，性格活泼开朗..."
    },
    {
      "role": "user",
      "content": "你好"
    }
  ],
  "temperature": 0.8,
  "max_tokens": 500,
  "presence_penalty": 0.6,
  "frequency_penalty": 0.3
}

// Response
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "gpt-4-turbo",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "你好呀！今天过得怎么样？"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 20,
    "total_tokens": 170
  }
}
```

### 1.2 流式响应接口

```typescript
// Request Body（额外参数）
{
  ...
  "stream": true
}

// Response (Server-Sent Events)
data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","choices":[{"delta":{"content":"你"},"index":0}]}

data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","choices":[{"delta":{"content":"好"},"index":0}]}

data: [DONE]
```

### 1.3 情绪分析接口（使用Function Calling）

```typescript
// Request Body
{
  "model": "gpt-4-turbo",
  "messages": [
    {
      "role": "user",
      "content": "分析这句话的情绪：我今天太开心了！"
    }
  ],
  "functions": [
    {
      "name": "detect_emotion",
      "description": "检测文本的情绪",
      "parameters": {
        "type": "object",
        "properties": {
          "emotion": {
            "type": "string",
            "enum": ["happy", "sad", "angry", "neutral", "surprised", "thinking"],
            "description": "情绪类型"
          },
          "intensity": {
            "type": "number",
            "description": "情绪强度 (0-1)"
          }
        },
        "required": ["emotion", "intensity"]
      }
    }
  ],
  "function_call": {"name": "detect_emotion"}
}

// Response
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "function_call": {
          "name": "detect_emotion",
          "arguments": "{\"emotion\":\"happy\",\"intensity\":0.9}"
        }
      }
    }
  ]
}
```

### 1.4 记忆提取接口

```typescript
// Request Body
{
  "model": "gpt-4-turbo",
  "messages": [
    {
      "role": "user",
      "content": "从以下对话中提取用户的关键信息：\n用户：我叫张三，今年25岁，喜欢打篮球\n请以JSON格式返回。"
    }
  ],
  "response_format": { "type": "json_object" }
}

// Response
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "{\"name\":\"张三\",\"age\":25,\"hobbies\":[\"打篮球\"]}"
      }
    }
  ]
}
```

---

## 2. 语音服务 (Azure Speech Services)

### 2.1 语音转文字 (STT)

**WebSocket API**

```typescript
// Connection URL
wss://YOUR_REGION.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=zh-CN

// Headers
{
  "Ocp-Apim-Subscription-Key": "YOUR_KEY"
}

// Send Audio Data (Binary)
// PCM 16-bit, 16kHz, mono

// Receive Messages
{
  "RecognitionStatus": "Success",
  "DisplayText": "你好，今天天气不错",
  "Offset": 0,
  "Duration": 25000000
}
```

**REST API（一次性识别）**

```typescript
// Endpoint
POST https://YOUR_REGION.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=zh-CN

// Headers
{
  "Ocp-Apim-Subscription-Key": "YOUR_KEY",
  "Content-Type": "audio/wav"
}

// Body: Binary audio data (WAV format)

// Response
{
  "RecognitionStatus": "Success",
  "DisplayText": "你好，今天天气不错"
}
```

### 2.2 文字转语音 (TTS)

**REST API**

```typescript
// Endpoint
POST https://YOUR_REGION.tts.speech.microsoft.com/cognitiveservices/v1

// Headers
{
  "Ocp-Apim-Subscription-Key": "YOUR_KEY",
  "Content-Type": "application/ssml+xml",
  "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3"
}

// Body (SSML)
<speak version='1.0' xml:lang='zh-CN'>
  <voice name='zh-CN-XiaoxiaoNeural'>
    <prosody rate='+10%' pitch='+5%'>
      你好，今天天气不错
    </prosody>
  </voice>
</speak>

// Response: Binary audio data (MP3)
```

### 2.3 获取可用音色列表

```typescript
// Endpoint
GET https://YOUR_REGION.tts.speech.microsoft.com/cognitiveservices/voices/list

// Headers
{
  "Ocp-Apim-Subscription-Key": "YOUR_KEY"
}

// Response
[
  {
    "Name": "zh-CN-XiaoxiaoNeural",
    "DisplayName": "Xiaoxiao",
    "LocalName": "晓晓",
    "ShortName": "zh-CN-XiaoxiaoNeural",
    "Gender": "Female",
    "Locale": "zh-CN",
    "StyleList": ["cheerful", "sad", "angry", "fearful"]
  },
  ...
]
```

---

## 3. 3D模型生成服务（可选）

### 3.1 照片转3D（Avaturn API示例）

```typescript
// Endpoint
POST https://api.avaturn.me/v1/avatars

// Headers
{
  "Authorization": "Bearer YOUR_API_KEY",
  "Content-Type": "multipart/form-data"
}

// Body (FormData)
{
  "photo": <File>,  // 用户照片
  "style": "realistic",
  "gender": "auto"
}

// Response
{
  "avatar_id": "av_xxx",
  "status": "processing",
  "estimated_time": 120  // 秒
}

// 查询生成状态
GET https://api.avaturn.me/v1/avatars/av_xxx

// Response（完成后）
{
  "avatar_id": "av_xxx",
  "status": "completed",
  "model_url": "https://cdn.avaturn.me/models/av_xxx.glb",
  "thumbnail_url": "https://cdn.avaturn.me/thumbnails/av_xxx.jpg"
}
```

---

## 4. 应用内部API设计

### 4.1 虚拟人管理

#### 创建虚拟人

```typescript
// TypeScript Interface
interface CreateVirtualHumanRequest {
  name: string;
  age?: number;
  gender: 'male' | 'female' | 'other';
  occupation?: string;
  personality: {
    extroversion: number;     // 0-1
    rationality: number;
    seriousness: number;
    openness: number;
    gentleness: number;
  };
  backgroundStory?: string;
  modelId: string;
  voiceId: string;
  outfitId: string;
  templateId?: string;
}

interface VirtualHuman {
  id: string;
  name: string;
  age?: number;
  gender: 'male' | 'female' | 'other';
  occupation?: string;
  personality: Personality;
  backgroundStory?: string;
  avatarUrl: string;
  modelId: string;
  voiceId: string;
  outfitId: string;
  createdAt: number;
  updatedAt: number;
  lastInteraction?: number;
  totalConversations: number;
  totalMessages: number;
  totalDuration: number;
  status: 'active' | 'archived' | 'draft';
}
```

#### 获取虚拟人列表

```typescript
interface GetVirtualHumansRequest {
  status?: 'active' | 'archived' | 'draft';
  sortBy?: 'created_at' | 'last_interaction' | 'name';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

interface GetVirtualHumansResponse {
  data: VirtualHuman[];
  total: number;
  hasMore: boolean;
}
```

### 4.2 对话管理

#### 发送消息

```typescript
interface SendMessageRequest {
  virtualHumanId: string;
  content: string;
  mode: 'text' | 'voice' | 'video';
  audioData?: ArrayBuffer;  // 如果是语音模式
}

interface SendMessageResponse {
  messageId: string;
  content: string;           // AI回复文本
  emotion: Emotion;          // 检测到的情绪
  audioUrl?: string;         // TTS生成的音频（语音/视频模式）
  tokensUsed: number;
  responseTime: number;      // 毫秒
}
```

#### 获取聊天历史

```typescript
interface GetChatHistoryRequest {
  virtualHumanId: string;
  limit?: number;            // 默认50
  offset?: number;           // 默认0
  beforeTimestamp?: number;  // 获取指定时间之前的消息
}

interface GetChatHistoryResponse {
  messages: Message[];
  hasMore: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode: 'text' | 'voice' | 'video';
  audioUrl?: string;
  emotion?: Emotion;
  timestamp: number;
  isImportant: boolean;
}
```

### 4.3 记忆系统

#### 获取记忆

```typescript
interface GetMemoriesRequest {
  virtualHumanId: string;
  category?: 'user_info' | 'preference' | 'event' | 'relationship' | 'fact';
  minImportance?: number;    // 1-5
  limit?: number;
}

interface Memory {
  id: string;
  virtualHumanId: string;
  category: string;
  key: string;
  value: string;
  importance: number;
  createdAt: number;
  lastAccessed?: number;
  accessCount: number;
}
```

#### 添加/更新记忆

```typescript
interface UpsertMemoryRequest {
  virtualHumanId: string;
  category: string;
  key: string;
  value: string;
  importance: number;
  expiresAt?: number;
}
```

### 4.4 导出/导入

#### 导出虚拟人配置

```typescript
interface ExportVirtualHumanResponse {
  version: string;           // 配置版本
  data: {
    name: string;
    personality: Personality;
    backgroundStory?: string;
    modelId: string;
    voiceId: string;
    outfitId: string;
    // 不包含聊天记录和私密数据
  };
  timestamp: number;
}
```

#### 导入虚拟人配置

```typescript
interface ImportVirtualHumanRequest {
  config: string;            // JSON字符串
}

interface ImportVirtualHumanResponse {
  virtualHumanId: string;
  conflicts?: string[];      // 冲突提示（如模型ID不存在）
}
```

---

## 5. 错误码定义

```typescript
enum ErrorCode {
  // 通用错误 (1xxx)
  UNKNOWN_ERROR = 1000,
  INVALID_REQUEST = 1001,
  UNAUTHORIZED = 1002,
  RATE_LIMIT_EXCEEDED = 1003,

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
  EXPORT_FAILED = 6004
}

interface ErrorResponse {
  code: ErrorCode;
  message: string;
  details?: any;
  timestamp: number;
}
```

---

## 6. 请求封装示例

### 6.1 AI Service封装

```typescript
class AIService {
  private apiKey: string;
  private baseURL = 'https://api.openai.com/v1';

  async chat(request: {
    messages: Message[];
    personality: Personality;
    memories: Memory[];
  }): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(request.personality, request.memories);

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'gpt-4-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            ...request.messages.map(m => ({
              role: m.role,
              content: m.content
            }))
          ],
          temperature: this.getTemperature(request.personality),
          max_tokens: 500
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new AppError(ErrorCode.RATE_LIMIT_EXCEEDED, '请求过于频繁，请稍后再试');
        }
        if (error.code === 'ECONNABORTED') {
          throw new AppError(ErrorCode.AI_SERVICE_ERROR, '请求超时');
        }
      }
      throw new AppError(ErrorCode.AI_SERVICE_ERROR, '对话服务异常');
    }
  }

  private buildSystemPrompt(personality: Personality, memories: Memory[]): string {
    let prompt = `你是一个虚拟人，性格特点如下：\n`;

    if (personality.extroversion > 0.6) {
      prompt += `- 外向开朗，喜欢主动聊天\n`;
    } else if (personality.extroversion < 0.4) {
      prompt += `- 内向安静，倾向于倾听\n`;
    }

    // ... 更多性格描述

    if (memories.length > 0) {
      prompt += `\n你记得以下关于用户的信息：\n`;
      memories.forEach(m => {
        prompt += `- ${m.value}\n`;
      });
    }

    prompt += `\n请以这个角色的口吻自然对话，不要说你是AI。`;

    return prompt;
  }

  private getTemperature(personality: Personality): number {
    // 根据性格调整随机性
    const creativity = (personality.openness + (1 - personality.rationality)) / 2;
    return 0.6 + creativity * 0.4; // 0.6 - 1.0
  }
}
```

### 6.2 Speech Service封装

```typescript
class SpeechService {
  private subscriptionKey: string;
  private region: string;

  async textToSpeech(text: string, voiceId: string): Promise<string> {
    const ssml = this.buildSSML(text, voiceId);

    try {
      const response = await axios.post(
        `https://${this.region}.tts.speech.microsoft.com/cognitiveservices/v1`,
        ssml,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': this.subscriptionKey,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3'
          },
          responseType: 'arraybuffer'
        }
      );

      // 保存到本地文件
      const filePath = await this.saveAudioFile(response.data);
      return filePath;
    } catch (error) {
      throw new AppError(ErrorCode.TTS_ERROR, '语音合成失败');
    }
  }

  private buildSSML(text: string, voiceId: string, rate: number = 1.0): string {
    const rateStr = rate === 1.0 ? 'default' : `${(rate - 1) * 100}%`;

    return `
      <speak version='1.0' xml:lang='zh-CN'>
        <voice name='${voiceId}'>
          <prosody rate='${rateStr}'>
            ${text}
          </prosody>
        </voice>
      </speak>
    `;
  }

  private async saveAudioFile(audioData: ArrayBuffer): Promise<string> {
    const fileName = `audio_${Date.now()}.mp3`;
    const filePath = `${RNFS.DocumentDirectoryPath}/audio/${fileName}`;

    await RNFS.mkdir(`${RNFS.DocumentDirectoryPath}/audio`);
    await RNFS.writeFile(filePath, Buffer.from(audioData).toString('base64'), 'base64');

    return filePath;
  }
}
```

---

## 7. 性能优化建议

### 7.1 请求缓存

```typescript
class CachedAIService extends AIService {
  private cache = new LRUCache<string, string>(100);

  async chat(request: ChatRequest): Promise<string> {
    const cacheKey = this.getCacheKey(request);

    // 检查缓存
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // 调用API
    const response = await super.chat(request);

    // 存入缓存
    this.cache.set(cacheKey, response);

    return response;
  }

  private getCacheKey(request: ChatRequest): string {
    return JSON.stringify({
      messages: request.messages.slice(-3), // 只用最后3条消息作为key
      personality: request.personality
    });
  }
}
```

### 7.2 请求队列

```typescript
class RequestQueue {
  private queue: (() => Promise<any>)[] = [];
  private processing = false;
  private maxConcurrent = 3;
  private currentCount = 0;

  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.process();
    });
  }

  private async process() {
    if (this.processing || this.currentCount >= this.maxConcurrent) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0 && this.currentCount < this.maxConcurrent) {
      const task = this.queue.shift()!;
      this.currentCount++;

      task().finally(() => {
        this.currentCount--;
        this.process();
      });
    }

    this.processing = false;
  }
}
```

---

**文档版本**: v1.0
**最后更新**: 2026-02-04
