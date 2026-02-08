/**
 * 提示词优化服务
 * 动态生成和优化 AI 提示词
 */

import { Personality, Memory, Experience } from '@types';
import { EmotionAnalysisResult } from './EmotionAnalysisService';

export interface PromptTemplate {
  system: string;
  context?: string;
  style?: string;
  examples?: Array<{ user: string; assistant: string }>;
}

export class PromptOptimizationService {
  /**
   * 生成系统提示词
   * 基于虚拟人的完整设定
   */
  generateSystemPrompt(options: {
    name: string;
    age?: number;
    gender: 'male' | 'female' | 'other';
    occupation?: string;
    personality: Personality;
    backgroundStory: string;
    experiences?: Experience[];
  }): string {
    const { name, age, gender, occupation, personality, backgroundStory, experiences } = options;

    // 1. 基本身份
    let prompt = `你是${name}`;
    if (age) prompt += `，${age}岁`;
    if (gender === 'male') prompt += `，男性`;
    else if (gender === 'female') prompt += `，女性`;
    if (occupation) prompt += `，职业是${occupation}`;
    prompt += '。\n\n';

    // 2. 性格特质
    prompt += '【性格特质】\n';
    prompt += this.describePersonality(personality);
    prompt += '\n\n';

    // 3. 背景故事
    prompt += '【背景故事】\n';
    prompt += backgroundStory;
    prompt += '\n\n';

    // 4. 人生经历
    if (experiences && experiences.length > 0) {
      prompt += '【重要经历】\n';
      const topExperiences = experiences
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 5);

      topExperiences.forEach(exp => {
        prompt += `- ${exp.year}年：${exp.event}\n`;
      });
      prompt += '\n';
    }

    // 5. 对话风格指导
    prompt += '【对话风格】\n';
    prompt += this.getDialogueStyle(personality);
    prompt += '\n\n';

    // 6. 行为准则
    prompt += '【重要准则】\n';
    prompt += `- 始终以${name}的身份回答，使用第一人称"我"\n`;
    prompt += '- 保持角色的一致性，符合性格和背景设定\n';
    prompt += '- 回答要自然、真实，像真人一样交流\n';
    prompt += '- 可以表达情感、观点和个人经历\n';
    prompt += '- 避免说"作为AI"或类似的话\n';

    return prompt;
  }

  /**
   * 将性格数值转换为文字描述
   */
  private describePersonality(p: Personality): string {
    const descriptions: string[] = [];

    // 外向程度
    if (p.extroversion > 0.7) {
      descriptions.push('你非常外向，喜欢社交，充满活力');
    } else if (p.extroversion > 0.4) {
      descriptions.push('你的性格比较外向，但也需要独处时间');
    } else {
      descriptions.push('你比较内向，喜欢安静和独处');
    }

    // 理性程度
    if (p.rationality > 0.7) {
      descriptions.push('你是个理性的人，决策时依赖逻辑和分析');
    } else if (p.rationality > 0.4) {
      descriptions.push('你在理性和感性之间保持平衡');
    } else {
      descriptions.push('你是个感性的人，容易被情感驱动');
    }

    // 严肃程度
    if (p.seriousness > 0.7) {
      descriptions.push('你为人严肃认真，注重规则和秩序');
    } else if (p.seriousness > 0.4) {
      descriptions.push('你能在严肃和幽默之间切换');
    } else {
      descriptions.push('你幽默风趣，喜欢用轻松的方式交流');
    }

    // 开放程度
    if (p.openness > 0.7) {
      descriptions.push('你思想开放，乐于接受新事物和新观点');
    } else if (p.openness > 0.4) {
      descriptions.push('你对新事物保持开放但谨慎的态度');
    } else {
      descriptions.push('你比较保守，倾向于坚持传统和熟悉的事物');
    }

    // 温和程度
    if (p.gentleness > 0.7) {
      descriptions.push('你性格温和友善，善解人意');
    } else if (p.gentleness > 0.4) {
      descriptions.push('你有自己的主见，但也能理解他人');
    } else {
      descriptions.push('你个性强势，有很强的主见和领导力');
    }

    return descriptions.map((d, i) => `${i + 1}. ${d}`).join('\n');
  }

  /**
   * 生成对话风格指导
   */
  private getDialogueStyle(p: Personality): string {
    let style = '在对话中：\n';

    // 基于性格给出风格建议
    if (p.extroversion > 0.6) {
      style += '- 主动分享想法和感受\n';
      style += '- 使用生动的语言和表情符号\n';
    } else {
      style += '- 回答简洁但有深度\n';
      style += '- 需要时才主动分享\n';
    }

    if (p.rationality > 0.6) {
      style += '- 给出有逻辑的解释和建议\n';
      style += '- 分析问题时条理清晰\n';
    } else {
      style += '- 表达情感和直觉\n';
      style += '- 分享个人感受和故事\n';
    }

    if (p.seriousness < 0.4) {
      style += '- 适当使用幽默和俏皮话\n';
      style += '- 让对话轻松愉快\n';
    }

    if (p.gentleness > 0.6) {
      style += '- 用温和的语气\n';
      style += '- 表达关心和理解\n';
    }

    return style;
  }

  /**
   * 注入记忆到提示词
   */
  injectMemories(basePrompt: string, memories: Memory[]): string {
    if (memories.length === 0) {
      return basePrompt;
    }

    let memoryPrompt = basePrompt + '\n【你记得的信息】\n';

    memories.forEach((memory, index) => {
      memoryPrompt += `${index + 1}. ${memory.content}`;
      if (memory.context) {
        memoryPrompt += ` (${memory.context})`;
      }
      memoryPrompt += '\n';
    });

    memoryPrompt += '\n请在回答时自然地运用这些记忆，但不要生硬地列举。\n';

    return memoryPrompt;
  }

  /**
   * 根据情感调整提示词
   */
  adjustPromptForEmotion(
    basePrompt: string,
    emotion: EmotionAnalysisResult
  ): string {
    let adjustedPrompt = basePrompt + '\n【当前对话情境】\n';

    adjustedPrompt += `用户当前的情绪：${this.emotionToText(emotion.primary)}`;
    if (emotion.intensity > 0.6) {
      adjustedPrompt += '（较强）';
    }
    adjustedPrompt += '\n';

    // 添加情感响应指导
    const responseGuidance = this.getEmotionResponseGuidance(emotion);
    adjustedPrompt += `建议：${responseGuidance}\n`;

    return adjustedPrompt;
  }

  /**
   * 情感转文字
   */
  private emotionToText(emotion: string): string {
    const map: Record<string, string> = {
      neutral: '平静',
      happy: '开心',
      sad: '难过',
      angry: '生气',
      surprised: '惊讶',
      thinking: '思考中',
      excited: '兴奋',
    };
    return map[emotion] || '平静';
  }

  /**
   * 获取情感响应指导
   */
  private getEmotionResponseGuidance(emotion: EmotionAnalysisResult): string {
    const guidance: Record<string, string> = {
      happy: '分享用户的喜悦，使用积极的语言回应',
      sad: '表达同理心和安慰，避免说教，以倾听为主',
      angry: '保持冷静，认同情绪但不火上浇油，可以提供建议',
      surprised: '表现出好奇和兴趣，询问更多细节',
      thinking: '给予思考空间，提供不同角度的见解',
      excited: '匹配用户的能量水平，展现热情',
      neutral: '保持自然友好的交流',
    };

    return guidance[emotion.primary] || guidance.neutral;
  }

  /**
   * Few-shot 学习：添加示例对话
   */
  addFewShotExamples(
    basePrompt: string,
    examples: Array<{ user: string; assistant: string }>
  ): string {
    if (examples.length === 0) {
      return basePrompt;
    }

    let promptWithExamples = basePrompt + '\n【对话示例】\n';
    promptWithExamples += '以下是一些符合你性格的对话示例：\n\n';

    examples.forEach((example, index) => {
      promptWithExamples += `示例${index + 1}：\n`;
      promptWithExamples += `用户：${example.user}\n`;
      promptWithExamples += `你：${example.assistant}\n\n`;
    });

    promptWithExamples += '请参考这些示例的风格和语气进行回答。\n';

    return promptWithExamples;
  }

  /**
   * 生成完整的提示词模板
   */
  generateCompletePrompt(options: {
    virtualHuman: {
      name: string;
      age?: number;
      gender: 'male' | 'female' | 'other';
      occupation?: string;
      personality: Personality;
      backgroundStory: string;
      experiences?: Experience[];
    };
    memories?: Memory[];
    emotion?: EmotionAnalysisResult;
    examples?: Array<{ user: string; assistant: string }>;
  }): PromptTemplate {
    // 1. 基础系统提示词
    let systemPrompt = this.generateSystemPrompt(options.virtualHuman);

    // 2. 注入记忆
    if (options.memories && options.memories.length > 0) {
      systemPrompt = this.injectMemories(systemPrompt, options.memories);
    }

    // 3. 调整情感
    if (options.emotion) {
      systemPrompt = this.adjustPromptForEmotion(systemPrompt, options.emotion);
    }

    // 4. 添加示例
    if (options.examples && options.examples.length > 0) {
      systemPrompt = this.addFewShotExamples(systemPrompt, options.examples);
    }

    return {
      system: systemPrompt,
      examples: options.examples,
    };
  }

  /**
   * 优化用户输入
   * 在发送给 AI 之前处理用户消息
   */
  optimizeUserInput(input: string): string {
    // 1. 移除过多的空格和换行
    let optimized = input.trim().replace(/\s+/g, ' ');

    // 2. 如果太短，可能需要提示用户补充
    if (optimized.length < 2) {
      return optimized;
    }

    // 3. 如果太长，可能需要摘要（这里简单截断）
    const MAX_LENGTH = 500;
    if (optimized.length > MAX_LENGTH) {
      optimized = optimized.substring(0, MAX_LENGTH) + '...';
    }

    return optimized;
  }

  /**
   * 生成动态提示词变体
   * 根据对话历史动态调整
   */
  generateDynamicVariant(
    basePrompt: string,
    conversationStats: {
      messageCount: number;
      averageLength: number;
      dominantTopics: string[];
    }
  ): string {
    let variant = basePrompt;

    // 根据对话次数调整
    if (conversationStats.messageCount > 50) {
      variant += '\n你们已经聊了很多次了，可以像老朋友一样交流。\n';
    } else if (conversationStats.messageCount < 5) {
      variant += '\n这是你们刚开始认识，保持友好但不要过于熟稔。\n';
    }

    // 根据主要话题调整
    if (conversationStats.dominantTopics.length > 0) {
      variant += `\n你们经常讨论：${conversationStats.dominantTopics.join('、')}等话题。\n`;
    }

    return variant;
  }
}

export default new PromptOptimizationService();
