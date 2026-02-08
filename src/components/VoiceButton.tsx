/**
 * 语音按钮组件（长按录音）
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '@constants';
import AudioRecorderService from '@services/AudioRecorderService';
import SpeechService from '@services/SpeechService';

interface VoiceButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  onTranscript,
  disabled = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const recordingPath = useRef<string>('');

  const handlePressIn = async () => {
    if (disabled || isProcessing) return;

    try {
      setIsRecording(true);

      // 动画效果
      Animated.spring(scaleAnim, {
        toValue: 1.2,
        useNativeDriver: true,
      }).start();

      // 开始录音
      await AudioRecorderService.startRecording();
    } catch (error) {
      console.error('Start recording failed:', error);
      setIsRecording(false);
      scaleAnim.setValue(1);
    }
  };

  const handlePressOut = async () => {
    if (!isRecording) return;

    try {
      setIsRecording(false);
      setIsProcessing(true);

      // 恢复动画
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();

      // 停止录音
      const audioPath = await AudioRecorderService.stopRecording();
      recordingPath.current = audioPath;

      // 转换为文字
      const text = await SpeechService.speechToText(audioPath);

      if (text) {
        onTranscript(text);
      }
    } catch (error) {
      console.error('Recording processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePressCancel = async () => {
    if (isRecording) {
      setIsRecording(false);
      scaleAnim.setValue(1);
      await AudioRecorderService.cancelRecording();
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || isProcessing}
        activeOpacity={1}
      >
        <Animated.View
          style={[
            styles.buttonInner,
            {
              transform: [{ scale: scaleAnim }],
              backgroundColor: isRecording
                ? Colors.light.error
                : disabled
                ? Colors.light.border
                : Colors.light.primary,
            },
          ]}
        >
          <Text style={styles.icon}>
            {isProcessing ? '⏳' : isRecording ? '⏹' : '🎤'}
          </Text>
        </Animated.View>
      </TouchableOpacity>

      <Text style={styles.hint}>
        {isProcessing
          ? '识别中...'
          : isRecording
          ? '松开发送，向上滑动取消'
          : '按住说话'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },

  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonInner: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },

  icon: {
    fontSize: 32,
  },

  hint: {
    marginTop: Spacing.sm,
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
});
