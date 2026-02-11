/**
 * 音频录制服务
 */

import { Platform, PermissionsAndroid } from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import AudioRecord from 'react-native-audio-record';
import RNFS from 'react-native-fs';
import { AppError, ErrorCode } from '@types';

export class AudioRecorderService {
  private recorderPlayer: AudioRecorderPlayer;
  private isRecording = false;
  private currentRecordPath = '';

  constructor() {
    this.recorderPlayer = new AudioRecorderPlayer();

    // 初始化录音配置 (录制为 Azure 需要的 16k 16bit 单声道 WAV)
    const options = {
      sampleRate: 16000,
      channels: 1,
      bitsPerSample: 16,
      audioSource: 6, // VoiceRecognition
      wavFile: 'audio.wav'
    };
    AudioRecord.init(options);
  }

  /**
   * 请求麦克风权限
   */
  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: '麦克风权限',
            message: '需要使用麦克风进行语音输入',
            buttonNeutral: '稍后询问',
            buttonNegative: '拒绝',
            buttonPositive: '允许',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('Permission request error:', err);
        return false;
      }
    }
    // iOS权限在info.plist中配置，运行时自动请求
    return true;
  }

  /**
   * 开始录音
   */
  async startRecording(onProgress?: (data: { currentMetering: number; currentPosition: number }) => void): Promise<void> {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      throw new AppError(ErrorCode.AUDIO_FORMAT_INVALID, '未获得麦克风权限');
    }

    try {
      if (this.isRecording) {
        await this.stopRecording();
      }

      console.log('🎙️ Starting WAV recording...');

      // 每次录音前重新初始化，防止 "uninitialized" 错误
      const options = {
        sampleRate: 16000,
        channels: 1,
        bitsPerSample: 16,
        audioSource: 6, // VoiceRecognition
        wavFile: 'audio.wav'
      };
      AudioRecord.init(options);

      AudioRecord.start();

      this.isRecording = true;
      this.currentRecordPath = '';
    } catch (error) {
      console.error('Start recording error:', error);
      throw new AppError(ErrorCode.AUDIO_FORMAT_INVALID, '录音失败');
    }
  }

  /**
   * 停止录音
   */
  async stopRecording(): Promise<string> {
    if (!this.isRecording) {
      console.warn('stopRecording called but not recording');
      return this.currentRecordPath;
    }

    try {
      console.log('⏹️ Stopping WAV recording...');
      const filePath = await AudioRecord.stop();
      this.currentRecordPath = filePath;
      this.isRecording = false;

      console.log('✅ WAV File created:', filePath);
      return filePath;
    } catch (error) {
      console.warn('Stop recorder warning:', error);
      this.isRecording = false;
      return '';
    }
  }

  /**
   * 开始录音 (别名，兼容 startRecorder 调用)
   */
  async startRecorder(onProgress?: (data: { currentMetering: number; currentPosition: number }) => void): Promise<void> {
    return this.startRecording(onProgress);
  }

  /**
   * 停止录音 (别名，兼容 stopRecorder 调用)
   */
  async stopRecorder(): Promise<string> {
    return this.stopRecording();
  }

  /**
   * 取消录音
   */
  async cancelRecording(): Promise<void> {
    if (this.isRecording) {
      await this.stopRecording();
      // 删除录音文件
      if (this.currentRecordPath) {
        await RNFS.unlink(this.currentRecordPath).catch(() => {});
      }
    }
  }

  /**
   * 播放音频
   */
  async playAudio(
    filePath: string,
    onProgress?: (data: { currentPosition: number; duration: number }) => void
  ): Promise<void> {
    try {
      await this.recorderPlayer.startPlayer(filePath);

      if (onProgress) {
        this.recorderPlayer.addPlayBackListener(onProgress);
      }
    } catch (error) {
      console.error('Play audio error:', error);
      throw new Error('播放失败');
    }
  }

  /**
   * 停止播放
   */
  async stopPlaying(): Promise<void> {
    try {
      await this.recorderPlayer.stopPlayer();
      this.recorderPlayer.removePlayBackListener();
    } catch (error) {
      console.error('Stop playing error:', error);
    }
  }

  /**
   * 暂停播放
   */
  async pausePlaying(): Promise<void> {
    try {
      await this.recorderPlayer.pausePlayer();
    } catch (error) {
      console.error('Pause playing error:', error);
    }
  }

  /**
   * 恢复播放
   */
  async resumePlaying(): Promise<void> {
    try {
      await this.recorderPlayer.resumePlayer();
    } catch (error) {
      console.error('Resume playing error:', error);
    }
  }

  /**
   * 设置音量
   */
  async setVolume(volume: number): Promise<void> {
    try {
      await this.recorderPlayer.setVolume(volume);
    } catch (error) {
      console.error('Set volume error:', error);
    }
  }

  /**
   * 获取录音时长（毫秒）
   */
  getRecordingDuration(): number {
    // 从文件路径解析或使用其他方法获取
    return 0;
  }

  /**
   * 清理
   */
  async cleanup(): Promise<void> {
    await this.stopRecording().catch(() => {});
    await this.stopPlaying().catch(() => {});
  }
}

export default new AudioRecorderService();
