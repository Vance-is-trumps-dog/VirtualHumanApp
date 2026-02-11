import { AppError, ErrorCode } from '../types';
import RNFS from 'react-native-fs';
import ConfigService from './ConfigService';
import { Platform } from 'react-native';
import { AZURE_SPEECH_KEY, AZURE_SPEECH_REGION } from '@env';

export class SpeechService {

  private getAzureCredentials() {
    // 1. 尝试从配置服务获取
    let apiKey = ConfigService.getApiKey('azureSpeech');
    let region = ConfigService.get('api').azureSpeechRegion;

    // 2. 如果配置为空，回退到环境变量
    if (!apiKey) apiKey = AZURE_SPEECH_KEY;
    // 如果 region 为空或者依然是旧默认值(eastus)但env里是新的，优先用Env
    if (!region || (region === 'eastus' && AZURE_SPEECH_REGION)) {
        region = AZURE_SPEECH_REGION || 'westus2';
    }

    // 默认兜底
    if (!region) region = 'westus2';

    console.log(`🔑 Azure Auth Check: Region=[${region}] KeyLength=[${apiKey ? apiKey.length : 0}]`);

    if (!apiKey || apiKey.trim() === '') {
      throw new AppError(
        ErrorCode.CONFIGURATION_ERROR,
        'Azure Speech Key 未配置，无法使用语音服务'
      );
    }
    return { apiKey, region };
  }

  /**
   * 语音转文字 (Azure STT REST API)
   * 注意: Azure REST API 仅支持 WAV/OGG 格式
   */
  async speechToText(audioPath: string): Promise<string> {
    try {
      console.log('🎙️ STT Requesting (Azure):', audioPath);
      const { apiKey, region } = this.getAzureCredentials();

      // 优化文件读取: 直接通过 fetch 读取本地文件为 Blob
      // 这比 base64 -> blob 转换更高效且兼容性更好
      const fileResponse = await fetch(`file://${audioPath}`);
      const blob = await fileResponse.blob();

      const url = `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=zh-CN`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': apiKey,
          'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
          'Accept': 'application/json',
        },
        body: blob as any, // React Native fetch supports Blob
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('❌ Azure STT Error:', response.status, text);

        if (response.status === 400) {
           throw new Error('Azure STT 格式错误 (请确保录音为WAV格式)');
        }
        throw new Error(`Azure STT 失败 (${response.status})`);
      }

      const data = await response.json();
      console.log('✅ Azure STT Result:', data);

      if (data.RecognitionStatus === 'Success') {
        return data.DisplayText;
      } else {
        console.warn('Azure STT No Match:', data.RecognitionStatus);
        return '';
      }

    } catch (error: any) {
      console.error('STT Exception:', error);
      throw error;
    }
  }

  /**
   * 文字转语音 (Azure TTS REST API)
   */
  async textToSpeech(text: string, voiceId: string = 'zh-CN-XiaoxiaoNeural', speed: number = 1.0): Promise<string> {
    try {
      console.log('🗣️ TTS Requesting (Azure):', text.substring(0, 20) + '...');
      const { apiKey, region } = this.getAzureCredentials();

      const fileName = `tts_${Date.now()}.mp3`;
      const destPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;

      // 构建 SSML
      const ssml = `
        <speak version='1.0' xml:lang='zh-CN'>
          <voice xml:lang='zh-CN' xml:gender='Female' name='${voiceId}'>
            ${text}
          </voice>
        </speak>
      `;

      const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;

      const options = {
        fromUrl: url,
        toFile: destPath,
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': apiKey,
          'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
          'Content-Type': 'application/ssml+xml',
          'User-Agent': 'VirtualHumanApp'
        },
        body: ssml,
      };

      const result = RNFS.downloadFile(options);
      const response = await result.promise;

      if (response.statusCode !== 200) {
        console.error('❌ Azure TTS Error Status:', response.statusCode);
        throw new Error(`Azure TTS 失败 (${response.statusCode})`);
      }

      console.log('✅ Azure TTS Saved to:', destPath);
      return destPath;

    } catch (error) {
      console.error('TTS Exception:', error);
      throw error;
    }
  }
}

export default new SpeechService();