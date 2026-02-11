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
   * @param text 要合成的文本
   * @param options 合成选项
   */
  async textToSpeech(
    text: string,
    options: {
      voiceId?: string;
      style?: string; // chat, cheerful, sad, etc.
      speed?: number; // 0.5 - 2.0
      pitch?: string; // default, high, low
    } = {}
  ): Promise<string> {
    try {
      const {
        voiceId = 'zh-CN-XiaoxiaoNeural',
        style = 'chat',
        speed = 1.0,
        pitch = 'default'
      } = options;

      console.log(`🗣️ TTS Requesting (Azure): [${voiceId}] ${text.substring(0, 20)}...`);
      const { apiKey, region } = this.getAzureCredentials();

      const fileName = `tts_${Date.now()}.mp3`;
      const destPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;

      // 语速转换
      const ratePct = Math.round((speed - 1.0) * 100);
      const rateStr = ratePct >= 0 ? `+${ratePct}%` : `${ratePct}%`;

      // 某些语音可能不支持 style，简单列表判断（实际应从 API 获取）
      // 晓晓、云希等通常支持 style，但为了稳健，如果 style 为 'chat' 且是默认情况，可以简化 SSML

      const ssmlContent = `
        <prosody rate="${rateStr}" pitch="${pitch}">
          ${text}
        </prosody>
      `;

      // 只有在明确指定了非默认 style 时才包裹 express-as
      // 且只对支持的中文语音添加
      const supportsStyle = ['zh-CN-XiaoxiaoNeural', 'zh-CN-YunxiNeural', 'zh-CN-XiaoyiNeural', 'zh-CN-YunyangNeural', 'zh-CN-XiaomengNeural', 'zh-CN-YunjianNeural'].includes(voiceId);

      let innerSSML = ssmlContent;
      if (supportsStyle && style && style !== 'default') {
          innerSSML = `
            <mstts:express-as style="${style}">
              ${ssmlContent}
            </mstts:express-as>
          `;
      }

      // 构建完整 SSML 的辅助函数
      const buildSSML = (targetVoiceId: string, useStyle: boolean, useProsody: boolean = true) => {
        let content = text;

        // 1. 包裹语速/音调 (Prosody)
        if (useProsody) {
          content = `
            <prosody rate="${rateStr}" pitch="${pitch}">
              ${content}
            </prosody>
          `;
        }

        // 2. 包裹情感风格 (Style)
        // 只有在明确指定了非默认 style，且支持 style，且当前尝试启用 style 时才包裹
        if (useStyle && supportsStyle && style && style !== 'default') {
          content = `
            <mstts:express-as style="${style}">
              ${content}
            </mstts:express-as>
          `;
        }

        // 3. 构建 Speak/Voice 标签
        // 移除 xml:gender 避免与 voiceId 性别不符导致的问题
        return `
          <speak version='1.0' xml:lang='zh-CN' xmlns:mstts='https://www.w3.org/2001/mstts'>
            <voice xml:lang='zh-CN' name='${targetVoiceId}'>
              ${content}
            </voice>
          </speak>
        `;
      };

      const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
      console.log(`📡 TTS URL: ${url}`); // 调试日志：确认 URL

      // 通用请求函数 (修复：使用 fetch 替代 RNFS.downloadFile 以支持 POST 和 Body)
      const doTTSRequest = async (ssmlBody: string): Promise<number> => {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Ocp-Apim-Subscription-Key': apiKey,
              'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
              'Content-Type': 'application/ssml+xml; charset=utf-8',
              'User-Agent': 'VirtualHumanApp'
            },
            body: ssmlBody,
          });

          if (!response.ok) {
            console.error('TTS Fetch Error:', response.status, await response.text());
            return response.status;
          }

          // 获取二进制数据并写入文件
          const blob = await response.blob();

          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = async () => {
              if (typeof reader.result === 'string') {
                // reader.result 格式为 "data:application/octet-stream;base64,....."
                const base64data = reader.result.split(',')[1];
                await RNFS.writeFile(destPath, base64data, 'base64');
                resolve(200);
              } else {
                resolve(500);
              }
            };
            reader.onerror = () => {
              console.error('Blob read error');
              resolve(500);
            };
            reader.readAsDataURL(blob);
          });

        } catch (err) {
          console.error('TTS Network Error:', err);
          return 500;
        }
      };

      // --- 尝试策略 ---

      // 优化：如果 prosody 是默认值，不要包裹标签，减少出错概率
      const useProsody = pitch !== 'default' || Math.abs(speed - 1.0) > 0.01;

      // 1. 完整尝试
      let statusCode = await doTTSRequest(buildSSML(voiceId, true, useProsody));

      // 2. 失败重试 A: 可能是风格(Style)不支持 -> 去除风格，保留语速
      if ((statusCode === 400 || statusCode === 404) && style && style !== 'default') {
        console.warn(`⚠️ Azure TTS Style '${style}' failed. Retrying without style...`);
        statusCode = await doTTSRequest(buildSSML(voiceId, false));
      }

      // 3. 失败重试 B: 可能是该 VoiceId 在该区域不可用 -> 尝试使用"晓晓"作为兜底 (Safety Voice)
      // 只有当当前 voiceId 不是晓晓时才重试，避免死循环
      const safetyVoice = 'zh-CN-XiaoxiaoNeural';
      if ((statusCode === 400 || statusCode === 404) && voiceId !== safetyVoice) {
        console.warn(`⚠️ Azure TTS Voice '${voiceId}' failed. Fallback to '${safetyVoice}'...`);
        statusCode = await doTTSRequest(buildSSML(safetyVoice, false));
      }

      if (statusCode !== 200) {
        console.error('❌ Azure TTS Final Failure:', statusCode);
        // 尝试读取错误文件内容（RNFS downloadFile 404 时，错误信息可能在文件中）
        try {
            const errContent = await RNFS.readFile(destPath, 'utf8');
            console.log('📄 Error Response Body:', errContent);
        } catch (e) { /* ignore */ }

        throw new Error(`Azure TTS 失败 (${statusCode})`);
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