/**
 * 情感分析服务
 * 增强的情感识别和响应
 */

import { Emotion } from '@types';

export interface EmotionAnalysisResult {
  primary: Emotion;
  secondary?: Emotion;
  intensity: number; // 0-1
  confidence: number; // 0-1
  details: {
    valence: number; // 情感效价 -1(负面) 到 1(正面)
    arousal: number; // 唤醒度 0(平静) 到 1(激动)
  };
}

export class EmotionAnalysisService {
  // 情感关键词词典
  private emotionKeywords: Record<Emotion, string[]> = {
    neutral: ['嗯', '好的', '知道了', '明白', '了解'],
    happy: ['开心', '高兴', '快乐', '哈哈', '棒', '好', '喜欢', '爱', '开心', '幸福', '满意', '舒服'],
    sad: ['难过', '伤心', '失落', '哭', '不开心', '郁闷', '沮丧', '痛苦', '悲伤', '遗憾'],
    angry: ['生气', '愤怒', '讨厌', '烦', '气', '可恶', '恼火', '不满', '愤慨'],
    surprised: ['惊讶', '意外', '没想到', '竟然', '天啊', '哇', '震惊', '不可思议', '吓'],
    thinking: ['想想', '考虑', '思考', '不确定', '也许', '可能', '大概', '琢磨'],
    excited: ['激动', '兴奋', '期待', '太棒了', '哇', '厉害', '赞', '牛'],
  };

  // 情感强度修饰词
  private intensityModifiers = {
    high: ['非常', '特别', '超级', '太', '极其', '十分', '格外', '相当'],
    low: ['有点', '稍微', '一点', '略微', '些许'],
  };

  // 否定词
  private negationWords = ['不', '没', '别', '勿', '非', '未', '无'];

  /**
   * 分析文本情感
   */
  async analyzeEmotion(text: string): Promise<EmotionAnalysisResult> {
    // 1. 预处理文本
    const processedText = text.toLowerCase().trim();

    // 2. 检测否定
    const hasNegation = this.detectNegation(processedText);

    // 3. 匹配情感关键词
    const emotionScores: Record<Emotion, number> = {
      neutral: 0,
      happy: 0,
      sad: 0,
      angry: 0,
      surprised: 0,
      thinking: 0,
      excited: 0,
    };

    for (const [emotion, keywords] of Object.entries(this.emotionKeywords)) {
      keywords.forEach(keyword => {
        if (processedText.includes(keyword)) {
          emotionScores[emotion as Emotion] += 1;
        }
      });
    }

    // 4. 检测强度修饰
    let intensityMultiplier = 1.0;
    this.intensityModifiers.high.forEach(modifier => {
      if (processedText.includes(modifier)) {
        intensityMultiplier = 1.5;
      }
    });
    this.intensityModifiers.low.forEach(modifier => {
      if (processedText.includes(modifier)) {
        intensityMultiplier = 0.6;
      }
    });

    // 5. 应用否定处理
    if (hasNegation) {
      // 反转正负情感
      const temp = emotionScores.happy;
      emotionScores.happy = emotionScores.sad * 0.5;
      emotionScores.sad = temp * 0.5;
    }

    // 6. 应用强度修饰
    for (const emotion in emotionScores) {
      emotionScores[emotion as Emotion] *= intensityMultiplier;
    }

    // 7. 找出主要情感
    const sortedEmotions = Object.entries(emotionScores)
      .sort((a, b) => b[1] - a[1]);

    const primary = (sortedEmotions[0][0] as Emotion) || 'neutral';
    const secondary = sortedEmotions[1][1] > 0 ? (sortedEmotions[1][0] as Emotion) : undefined;

    // 8. 计算置信度
    const totalScore = Object.values(emotionScores).reduce((sum, score) => sum + score, 0);
    const confidence = totalScore > 0 ? sortedEmotions[0][1] / totalScore : 0.5;

    // 9. 计算强度
    const intensity = Math.min(1, sortedEmotions[0][1] * 0.3 * intensityMultiplier);

    // 10. 计算情感维度
    const valence = this.calculateValence(emotionScores);
    const arousal = this.calculateArousal(emotionScores);

    return {
      primary,
      secondary,
      intensity,
      confidence,
      details: {
        valence,
        arousal,
      },
    };
  }

  /**
   * 检测否定
   */
  private detectNegation(text: string): boolean {
    return this.negationWords.some(word => text.includes(word));
  }

  /**
   * 计算情感效价（正负）
   */
  private calculateValence(scores: Record<Emotion, number>): number {
    const positive = scores.happy + scores.excited;
    const negative = scores.sad + scores.angry;
    const total = positive + negative;

    if (total === 0) return 0;
    return (positive - negative) / total;
  }

  /**
   * 计算唤醒度（激动程度）
   */
  private calculateArousal(scores: Record<Emotion, number>): number {
    const highArousal = scores.excited + scores.angry + scores.surprised;
    const lowArousal = scores.sad + scores.thinking + scores.neutral;
    const total = highArousal + lowArousal;

    if (total === 0) return 0.5;
    return highArousal / total;
  }

  /**
   * 根据情感生成适当的回应风格
   */
  getResponseStyle(emotion: EmotionAnalysisResult): {
    tone: string;
    pace: string;
    suggestions: string[];
  } {
    const styles: Record<Emotion, {
      tone: string;
      pace: string;
      suggestions: string[];
    }> = {
      neutral: {
        tone: '平和、友好',
        pace: '适中',
        suggestions: ['保持自然交流', '可以主动提出话题'],
      },
      happy: {
        tone: '欢快、积极',
        pace: '稍快',
        suggestions: ['分享用户的喜悦', '使用积极的语言', '可以适当使用感叹号'],
      },
      sad: {
        tone: '温柔、同理心',
        pace: '缓慢',
        suggestions: ['表达理解和安慰', '避免说教', '倾听为主'],
      },
      angry: {
        tone: '冷静、理解',
        pace: '适中',
        suggestions: ['保持冷静', '认同情绪', '避免辩解', '提供解决方案'],
      },
      surprised: {
        tone: '好奇、感兴趣',
        pace: '稍快',
        suggestions: ['回应惊讶', '询问细节', '分享感受'],
      },
      thinking: {
        tone: '深思、引导',
        pace: '缓慢',
        suggestions: ['给予思考空间', '提供不同角度', '避免急于给答案'],
      },
      excited: {
        tone: '热情、活力',
        pace: '快',
        suggestions: ['匹配能量水平', '展现热情', '鼓励分享更多'],
      },
    };

    return styles[emotion.primary];
  }

  /**
   * 情感历史分析
   * 分析用户在一段时间内的情感变化
   */
  analyzeEmotionTrend(
    emotions: Array<{ emotion: Emotion; timestamp: number }>
  ): {
    dominantEmotion: Emotion;
    moodStability: number; // 0-1，越高越稳定
    emotionDistribution: Record<Emotion, number>;
    trend: 'improving' | 'declining' | 'stable';
  } {
    if (emotions.length === 0) {
      return {
        dominantEmotion: 'neutral',
        moodStability: 1,
        emotionDistribution: {
          neutral: 1,
          happy: 0,
          sad: 0,
          angry: 0,
          surprised: 0,
          thinking: 0,
          excited: 0,
        },
        trend: 'stable',
      };
    }

    // 统计情感分布
    const distribution: Record<Emotion, number> = {
      neutral: 0,
      happy: 0,
      sad: 0,
      angry: 0,
      surprised: 0,
      thinking: 0,
      excited: 0,
    };

    emotions.forEach(item => {
      distribution[item.emotion] += 1;
    });

    // 归一化
    const total = emotions.length;
    for (const emotion in distribution) {
      distribution[emotion as Emotion] /= total;
    }

    // 找出主导情感
    const dominant = Object.entries(distribution)
      .sort((a, b) => b[1] - a[1])[0][0] as Emotion;

    // 计算稳定性（使用标准差的倒数）
    const values = Object.values(distribution);
    const mean = 1 / 7; // 平均分布
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stability = 1 / (1 + Math.sqrt(variance) * 10); // 归一化到 0-1

    // 分析趋势（比较前半部分和后半部分）
    const midPoint = Math.floor(emotions.length / 2);
    const firstHalf = emotions.slice(0, midPoint);
    const secondHalf = emotions.slice(midPoint);

    const firstHalfPositive = firstHalf.filter(e => e.emotion === 'happy' || e.emotion === 'excited').length;
    const secondHalfPositive = secondHalf.filter(e => e.emotion === 'happy' || e.emotion === 'excited').length;

    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    const diff = (secondHalfPositive / secondHalf.length) - (firstHalfPositive / firstHalf.length);
    if (diff > 0.1) trend = 'improving';
    else if (diff < -0.1) trend = 'declining';

    return {
      dominantEmotion: dominant,
      moodStability: stability,
      emotionDistribution: distribution,
      trend,
    };
  }

  /**
   * 根据情感调整对话参数
   */
  getAIParameters(emotion: EmotionAnalysisResult): {
    temperature: number;
    maxTokens: number;
    styleHint: string;
  } {
    const baseTemp = 0.8;
    const baseTokens = 500;

    let temperature = baseTemp;
    let maxTokens = baseTokens;
    let styleHint = '';

    switch (emotion.primary) {
      case 'happy':
      case 'excited':
        temperature = 0.9; // 更有创造性
        styleHint = '用积极、活泼的语气回应';
        break;

      case 'sad':
        temperature = 0.7; // 更稳定、温和
        maxTokens = 600; // 可以说更多安慰的话
        styleHint = '用温柔、理解的语气回应，表达同理心';
        break;

      case 'angry':
        temperature = 0.6; // 更理性、冷静
        styleHint = '保持冷静、理性，避免火上浇油';
        break;

      case 'thinking':
        temperature = 0.7;
        maxTokens = 600; // 提供更详细的思考
        styleHint = '提供深思熟虑的回答，引导思考';
        break;

      case 'surprised':
        temperature = 0.85;
        styleHint = '表达好奇和兴趣，询问更多细节';
        break;

      default:
        styleHint = '保持自然、友好的对话';
    }

    return {
      temperature,
      maxTokens,
      styleHint,
    };
  }
}

export default new EmotionAnalysisService();
