import { AppError, ErrorCode, Voice } from '../types';
import { AZURE_SPEECH_KEY, AZURE_SPEECH_REGION } from '@env';
import RNFS from 'react-native-fs';

export class SpeechService {
  private subscriptionKey: string;
  private region: string;

  constructor() {
    this.subscriptionKey = AZURE_SPEECH_KEY || '';
    this.region = AZURE_SPEECH_REGION || 'westus2';
  }

  async textToSpeech(text: string, voiceId: string, speed?: number): Promise<string> {
    // 模拟实现，防止报错
    console.log('TTS called:', text, voiceId, speed);
    return '';
  }

  async speechToText(audioPath: string): Promise<string> {
    console.log('STT called:', audioPath);
    return '语音识别测试';
  }
}

export default new SpeechService();
