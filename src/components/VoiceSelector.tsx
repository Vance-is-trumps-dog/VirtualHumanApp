/**
 * 声音选择器
 * 用于选择内置音色或创建自定义音色
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius, BUILTIN_VOICES } from '@constants';
import SpeechService from '@services/SpeechService';
import VoiceCloneService from '@services/VoiceCloneService';
import { AudioRecorderService } from '@services/AudioRecorderService';

interface VoiceSelectorProps {
  voiceId: string;
  gender: 'male' | 'female' | 'other';
  onChange: (voiceId: string) => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  voiceId,
  gender,
  onChange,
}) => {
  const [playing, setPlaying] = useState<string | null>(null);
  const [showClonePanel, setShowClonePanel] = useState(false);
  const [recordedSamples, setRecordedSamples] = useState<string[]>([]);
  const [recording, setRecording] = useState(false);
  const [cloning, setCloning] = useState(false);

  // 过滤音色列表
  const filteredVoices = BUILTIN_VOICES.filter(
    (voice) => gender === 'other' || voice.gender === gender
  );

  const handlePreview = async (voice: typeof BUILTIN_VOICES[0]) => {
    if (playing === voice.id) {
      // 停止播放
      setPlaying(null);
      return;
    }

    try {
      setPlaying(voice.id);

      // 生成试听文本
      const previewText = '你好，我是' + voice.displayName + '，很高兴认识你。';

      // 调用TTS
      const audioUri = await SpeechService.textToSpeech(previewText, {
        voiceId: voice.id,
      });

      // 播放音频
      const recorder = new AudioRecorderService();
      await recorder.playAudio(audioUri);

    } catch (error) {
      Alert.alert('错误', '音色试听失败');
    } finally {
      setPlaying(null);
    }
  };

  const handleStartClone = () => {
    setShowClonePanel(true);
    setRecordedSamples([]);
  };

  const handleRecord = async () => {
    if (recording) {
      // 停止录音
      try {
        const recorder = new AudioRecorderService();
        const audioUri = await recorder.stopRecording();

        // 验证质量
        const validation = await VoiceCloneService.validateAudioSample(audioUri);

        if (!validation.valid) {
          Alert.alert(
            '录音质量不佳',
            validation.issues.join('\n'),
            [
              { text: '重新录制', style: 'cancel' },
              { text: '仍然使用', onPress: () => {
                setRecordedSamples([...recordedSamples, audioUri]);
              }},
            ]
          );
        } else {
          setRecordedSamples([...recordedSamples, audioUri]);
          Alert.alert('成功', `录音质量: ${validation.quality === 'high' ? '优秀' : '良好'}`);
        }

        setRecording(false);
      } catch (error) {
        Alert.alert('错误', '录音失败');
        setRecording(false);
      }
    } else {
      // 开始录音
      try {
        const recorder = new AudioRecorderService();
        await recorder.startRecording();
        setRecording(true);
      } catch (error) {
        Alert.alert('错误', '无法开始录音');
      }
    }
  };

  const handleSubmitClone = async () => {
    if (recordedSamples.length < 3) {
      Alert.alert('提示', '请至少录制3段音频样本');
      return;
    }

    try {
      setCloning(true);

      const result = await VoiceCloneService.cloneVoice(recordedSamples, {
        name: '我的音色',
        description: '自定义克隆音色',
        language: 'zh-CN',
      });

      Alert.alert('提交成功', `音色正在生成中，预计需要${Math.floor((result.estimatedTime || 300) / 60)}分钟`);

      // 轮询状态（实际应用中可以改为推送通知）
      // 这里简化处理
      await VoiceCloneService.saveVoiceToDatabase({
        id: result.voiceId,
        name: '我的音色',
        gender: gender === 'other' ? 'neutral' : gender,
        description: '自定义克隆音色',
      });

      onChange(result.voiceId);
      setShowClonePanel(false);
      Alert.alert('成功', '音色已添加');

    } catch (error) {
      Alert.alert('错误', '音色克隆失败');
    } finally {
      setCloning(false);
    }
  };

  const sampleTexts = VoiceCloneService.getSampleTexts();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {!showClonePanel ? (
        <>
          {/* 内置音色列表 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>内置音色</Text>
            {filteredVoices.map((voice) => (
              <TouchableOpacity
                key={voice.id}
                style={[
                  styles.voiceItem,
                  voiceId === voice.id && styles.voiceItemActive,
                ]}
                onPress={() => onChange(voice.id)}
              >
                <View style={styles.voiceInfo}>
                  <Text style={styles.voiceName}>
                    {voice.displayName}
                    <Text style={styles.voiceGender}>
                      {' '}({voice.gender === 'male' ? '男' : '女'})
                    </Text>
                  </Text>
                  <Text style={styles.voiceDescription}>{voice.description}</Text>
                </View>

                <TouchableOpacity
                  style={styles.previewButton}
                  onPress={() => handlePreview(voice)}
                >
                  {playing === voice.id ? (
                    <ActivityIndicator size="small" color={Colors.light.primary} />
                  ) : (
                    <Text style={styles.previewButtonText}>🔊 试听</Text>
                  )}
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>

          {/* 自定义音色按钮 */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.cloneButton}
              onPress={handleStartClone}
            >
              <Text style={styles.cloneButtonText}>🎤 创建自定义音色</Text>
              <Text style={styles.cloneButtonHint}>通过录音克隆您的声音</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        // 音色克隆面板
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>创建自定义音色</Text>

          <View style={styles.clonePanel}>
            <Text style={styles.cloneInstruction}>
              请按照提示录制以下文本（至少3段，每段30秒以上）：
            </Text>

            {sampleTexts.map((text, index) => (
              <View key={index} style={styles.sampleItem}>
                <View style={styles.sampleHeader}>
                  <Text style={styles.sampleNumber}>样本 {index + 1}</Text>
                  {recordedSamples[index] && (
                    <Text style={styles.sampleStatus}>✓ 已录制</Text>
                  )}
                </View>
                <Text style={styles.sampleText}>{text}</Text>
              </View>
            ))}

            <TouchableOpacity
              style={[
                styles.recordButton,
                recording && styles.recordButtonActive,
              ]}
              onPress={handleRecord}
            >
              <Text style={styles.recordButtonText}>
                {recording ? '⏹ 停止录音' : '🎙 开始录音'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.recordHint}>
              已录制 {recordedSamples.length}/{sampleTexts.length} 段
            </Text>

            <View style={styles.cloneActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowClonePanel(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (recordedSamples.length < 3 || cloning) && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmitClone}
                disabled={recordedSamples.length < 3 || cloning}
              >
                {cloning ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>提交克隆</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  section: {
    padding: Spacing.md,
  },

  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },

  voiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.light.border,
    marginBottom: Spacing.sm,
  },

  voiceItemActive: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary + '10',
  },

  voiceInfo: {
    flex: 1,
  },

  voiceName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },

  voiceGender: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    fontWeight: 'normal',
  },

  voiceDescription: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
  },

  previewButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.light.border,
    minWidth: 80,
    alignItems: 'center',
  },

  previewButtonText: {
    fontSize: FontSizes.sm,
    color: Colors.light.text,
    fontWeight: '600',
  },

  cloneButton: {
    padding: Spacing.lg,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
  },

  cloneButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.light.primary,
    marginBottom: Spacing.xs,
  },

  cloneButtonHint: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
  },

  clonePanel: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },

  cloneInstruction: {
    fontSize: FontSizes.md,
    color: Colors.light.text,
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },

  sampleItem: {
    backgroundColor: Colors.light.background,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },

  sampleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },

  sampleNumber: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.light.text,
  },

  sampleStatus: {
    fontSize: FontSizes.sm,
    color: Colors.light.success,
    fontWeight: '600',
  },

  sampleText: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },

  recordButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
  },

  recordButtonActive: {
    backgroundColor: Colors.light.error,
  },

  recordButtonText: {
    fontSize: FontSizes.md,
    color: '#fff',
    fontWeight: '600',
  },

  recordHint: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },

  cloneActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },

  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
  },

  cancelButtonText: {
    fontSize: FontSizes.md,
    color: Colors.light.text,
    fontWeight: '600',
  },

  submitButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
  },

  submitButtonDisabled: {
    backgroundColor: Colors.light.border,
  },

  submitButtonText: {
    fontSize: FontSizes.md,
    color: '#fff',
    fontWeight: '600',
  },
});
