/**
 * 语音服务 - Azure Speech Services
 */

import {
  AZURE_SPEECH_KEY,
  AZURE_SPEECH_REGION,
} from '@env';
import { AppError, ErrorCode, Voice } from '@types';
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';

// Azure SDK 类型（如果安装了SDK）
type SpeechRecognizer = unknown;
type SpeechSynthesizer = unknown;

export class SpeechService {
  private subscriptionKey: string;
  private region: string;
  private recognizer: SpeechRecognizer | null = null;
  private synthesizer: SpeechSynthesizer | null = null;

  constructor() {
    // 验证Azure Speech密钥
    const speechKey = AZURE_SPEECH_KEY;
    const speechRegion = AZURE_SPEECH_REGION;

    if (!speechKey || speechKey.trim() === '') {
      throw new AppError(
        ErrorCode.CONFIGURATION_ERROR,
        'AZURE_SPEECH_KEY is not configured. Please check your .env file.'
      );
    }
    if (speechKey.includes('your-') || speechKey.includes('YOUR_')) {
      throw new AppError(
        ErrorCode.CONFIGURATION_ERROR,
        'AZURE_SPEECH_KEY contains placeholder value. Please set a valid API key.'
      );
    }
    if (!speechRegion || speechRegion.trim() === '') {
      throw new AppError(
        ErrorCode.CONFIGURATION_ERROR,
        'AZURE_SPEECH_REGION is not configured. Please check your .env file.'
      );
    }

    this.subscriptionKey = speechKey;
    this.region = speechRegion;
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    // 清理识别器和合成器资源
    if (this.recognizer) {
      // 如果使用Azure SDK，调用 close() 方法
      // (this.recognizer as any).close?.();
      this.recognizer = null;
    }

    if (this.synthesizer) {
      // 如果使用Azure SDK，调用 close() 方法
      // (this.synthesizer as any).close?.();
      this.synthesizer = null;
    }
  }

  /**
   * 语音转文字（Speech to Text）
   * 使用REST API方式（简化版）
   */
  async speechToText(audioFilePath: string): Promise<string> {
    try {
      // 读取音频文件
      const audioData = await RNFS.readFile(audioFilePath, 'base64');
      const audioBuffer = Buffer.from(audioData, 'base64');

      // 调用Azure STT REST API
      const response = await fetch(
        `https://${this.region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=zh-CN`,
        {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': this.subscriptionKey,
            'Content-Type': 'audio/wav',
            'Accept': 'application/json',
          },
          body: audioBuffer,
        }
      );

      if (!response.ok) {
        throw new Error(`STT failed: ${response.status}`);
      }

      const result = await response.json();

      if (result.RecognitionStatus === 'Success') {
        return result.DisplayText;
      } else {
        throw new Error('Speech recognition failed');
      }
    } catch (error) {
      console.error('Speech to text error:', error);
      throw new AppError(ErrorCode.STT_ERROR, '语音识别失败');
    }
  }

  /**
   * 文字转语音（Text to Speech）
   */
  async textToSpeech(
    text: string,
    voiceId: string,
    rate: number = 1.0,
    pitch: number = 0
  ): Promise<string> {
    try {
      // 构建SSML
      const ssml = this.buildSSML(text, voiceId, rate, pitch);

      // 调用Azure TTS REST API
      const response = await fetch(
        `https://${this.region}.tts.speech.microsoft.com/cognitiveservices/v1`,
        {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': this.subscriptionKey,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
          },
          body: ssml,
        }
      );

      if (!response.ok) {
        throw new Error(`TTS failed: ${response.status}`);
      }

      // 保存音频文件
      const audioData = await response.arrayBuffer();
      const fileName = `tts_${Date.now()}.mp3`;
      const filePath = `${RNFS.DocumentDirectoryPath}/audio/${fileName}`;

      // 确保目录存在
      await RNFS.mkdir(`${RNFS.DocumentDirectoryPath}/audio`).catch(() => {});

      // 写入文件
      await RNFS.writeFile(
        filePath,
        Buffer.from(audioData).toString('base64'),
        'base64'
      );

      return filePath;
    } catch (error) {
      console.error('Text to speech error:', error);
      throw new AppError(ErrorCode.TTS_ERROR, '语音合成失败');
    }
  }

  /**
   * 构建SSML（Speech Synthesis Markup Language）
   */
  private buildSSML(
    text: string,
    voiceId: string,
    rate: number = 1.0,
    pitch: number = 0
  ): string {
    // 计算语速百分比
    const ratePercent = rate === 1.0 ? 'default' : `${Math.round((rate - 1) * 100)}%`;

    // 计算音调
    const pitchValue = pitch === 0 ? 'default' : `${pitch > 0 ? '+' : ''}${pitch}Hz`;

    return `
      <speak version='1.0' xml:lang='zh-CN'>
        <voice name='${voiceId}'>
          <prosody rate='${ratePercent}' pitch='${pitchValue}'>
            ${this.escapeXml(text)}
          </prosody>
        </voice>
      </speak>
    `.trim();
  }

  /**
   * 转义XML特殊字符
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * 获取可用音色列表
   */
  async getAvailableVoices(): Promise<Voice[]> {
    try {
      const response = await fetch(
        `https://${this.region}.tts.speech.microsoft.com/cognitiveservices/voices/list`,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': this.subscriptionKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get voices');
      }

      const voices = await response.json();

      // 过滤中文音色
      return voices
        .filter((v: any) => v.Locale.startsWith('zh-'))
        .map((v: any) => ({
          id: v.ShortName,
          name: v.Name,
          displayName: v.LocalName,
          locale: v.Locale,
          gender: v.Gender.toLowerCase(),
          description: v.LocalName,
          styles: v.StyleList || [],
        }));
    } catch (error) {
      console.error('Get voices error:', error);
      return [];
    }
  }

  /**
   * 测试语音（试听）
   */
  async previewVoice(voiceId: string, sampleText: string = '你好，这是一段测试语音。'): Promise<string> {
    return this.textToSpeech(sampleText, voiceId);
  }

  /**
   * 清理音频缓存
   */
  async clearAudioCache(): Promise<void> {
    try {
      const audioDir = `${RNFS.DocumentDirectoryPath}/audio`;
      const exists = await RNFS.exists(audioDir);

      if (exists) {
        const files = await RNFS.readDir(audioDir);
        const now = Date.now();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天

        for (const file of files) {
          // 删除超过7天的文件
          if (now - new Date(file.mtime!).getTime() > maxAge) {
            await RNFS.unlink(file.path);
          }
        }
      }
    } catch (error) {
      console.error('Clear audio cache error:', error);
    }
  }
}

export default new SpeechService();
