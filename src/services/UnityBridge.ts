/**
 * Unity桥接服务
 * 用于React Native与Unity之间的双向通信
 */

import { NativeModules, NativeEventEmitter, EmitterSubscription } from 'react-native';
import { UnityMessage, UnityCommand, UnityMessageData, Emotion } from '@types';

// Unity模块（需要安装 @azesmway/react-native-unity）
// const UnityModule = NativeModules.UnityModule;

/**
 * 消息处理器类型
 */
type MessageHandler = (data: UnityMessageData | undefined) => void;

export class UnityBridge {
  private eventEmitter: NativeEventEmitter | null = null;
  private messageHandlers: Map<string, MessageHandler> = new Map();
  private eventSubscriptions: EmitterSubscription[] = [];
  private isReady = false;

  constructor() {
    // 初始化事件监听器
    // if (UnityModule) {
    //   this.eventEmitter = new NativeEventEmitter(UnityModule);
    //   this.setupEventListeners();
    // }
  }

  /**
   * 设置事件监听
   */
  private setupEventListeners() {
    if (!this.eventEmitter) return;

    // 监听Unity发来的消息
    const subscription = this.eventEmitter.addListener('onUnityMessage', (message: UnityMessage) => {
      console.log('Unity message received:', message);

      // 处理特定类型的消息
      switch (message.type) {
        case 'modelLoaded':
          this.isReady = true;
          this.triggerHandler('modelLoaded', message.data);
          break;

        case 'animationComplete':
          this.triggerHandler('animationComplete', message.data);
          break;

        case 'error':
          console.error('Unity error:', message.data);
          this.triggerHandler('error', message.data);
          break;

        default:
          this.triggerHandler(message.type, message.data);
      }
    });
  }

  /**
   * 发送命令到Unity
   */
  private sendCommand(command: UnityCommand) {
    // if (UnityModule && UnityModule.postMessage) {
    //   UnityModule.postMessage(JSON.stringify(command));
    // } else {
    //   console.warn('Unity module not available');
    // }

    console.log('Sending command to Unity:', command);
  }

  /**
   * 切换3D模型
   */
  switchModel(modelId: string) {
    this.sendCommand({
      type: 'switchModel',
      params: { modelId },
    });
  }

  /**
   * 更换服装
   */
  changeOutfit(outfitId: string) {
    this.sendCommand({
      type: 'changeOutfit',
      params: { outfitId },
    });
  }

  /**
   * 播放动画
   */
  playAnimation(animationName: string, loop: boolean = false) {
    this.sendCommand({
      type: 'playAnimation',
      params: { animationName, loop },
    });
  }

  /**
   * 设置情绪表情
   */
  setEmotion(emotion: Emotion, intensity: number = 1.0) {
    this.sendCommand({
      type: 'setEmotion',
      params: { emotion, intensity },
    });
  }

  /**
   * 设置口型同步数据
   */
  setLipSync(visemeData: number[]) {
    this.sendCommand({
      type: 'setLipSync',
      params: { visemeData },
    });
  }

  /**
   * 播放语音并同步口型
   */
  async playAudioWithLipSync(audioUrl: string, text: string) {
    // 1. 分析文本生成viseme数据
    const visemeData = this.textToViseme(text);

    // 2. 发送到Unity
    this.sendCommand({
      type: 'playAudioWithLipSync',
      params: { audioUrl, visemeData },
    });
  }

  /**
   * 设置摄像机视角
   */
  setCameraView(viewType: 'full' | 'upper' | 'face') {
    this.sendCommand({
      type: 'setCameraView',
      params: { viewType },
    });
  }

  /**
   * 设置背景场景
   */
  setBackground(backgroundId: string) {
    this.sendCommand({
      type: 'setBackground',
      params: { backgroundId },
    });
  }

  /**
   * 停止所有动画
   */
  stopAllAnimations() {
    this.sendCommand({
      type: 'stopAllAnimations',
      params: {},
    });
  }

  /**
   * 重置到待机状态
   */
  resetToIdle() {
    this.sendCommand({
      type: 'resetToIdle',
      params: {},
    });
  }

  /**
   * 注册消息处理器
   */
  onMessage(eventType: string, handler: MessageHandler): void {
    this.messageHandlers.set(eventType, handler);
  }

  /**
   * 移除消息处理器
   */
  offMessage(eventType: string): void {
    this.messageHandlers.delete(eventType);
  }

  /**
   * 触发消息处理器
   */
  private triggerHandler(eventType: string, data: UnityMessageData | undefined): void {
    const handler = this.messageHandlers.get(eventType);
    if (handler) {
      handler(data);
    }
  }

  /**
   * 文本转Viseme数据（简化版）
   * 实际应使用专业的语音分析或Azure的viseme事件
   */
  private textToViseme(text: string): number[] {
    // 这是一个简化的实现
    // 实际应该使用音素（phoneme）到视位（viseme）的映射
    const visemeData: number[] = [];

    // 简单示例：根据字符生成随机viseme
    // 实际应该使用语音分析API
    for (let i = 0; i < text.length; i++) {
      // 生成0-20之间的viseme ID（标准viseme集合）
      const visemeId = Math.floor(Math.random() * 21);
      visemeData.push(visemeId);
    }

    return visemeData;
  }

  /**
   * 获取Unity就绪状态
   */
  isUnityReady(): boolean {
    return this.isReady;
  }

  /**
   * 等待Unity就绪
   */
  async waitForReady(timeout: number = 5000): Promise<boolean> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.isReady) {
          clearInterval(checkInterval);
          resolve(true);
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          resolve(false);
        }
      }, 100);
    });
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    // 移除所有事件监听器
    if (this.eventEmitter) {
      for (const subscription of this.eventSubscriptions) {
        subscription.remove();
      }
      this.eventSubscriptions = [];
    }

    // 清理消息处理器
    this.messageHandlers.clear();
    this.isReady = false;
  }
}

export default new UnityBridge();
