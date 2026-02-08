/**
 * 语音聊天页面
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Image,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@navigation/RootNavigator';
import { useChatStore, useVirtualHumanStore } from '@store';
import { VoiceButton, Loading, AudioPlayer } from '@components';
import { Colors, Spacing, FontSizes } from '@constants';

type VoiceChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;
type VoiceChatScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Chat'>;

interface VoiceChatScreenProps {
  route: VoiceChatScreenRouteProp;
  navigation: VoiceChatScreenNavigationProp;
}

export const VoiceChatScreen: React.FC<VoiceChatScreenProps> = ({ route, navigation }) => {
  const { virtualHumanId } = route.params;
  const { messages, typing, sendMessage } = useChatStore();
  const { currentVirtualHuman, setCurrentVirtualHuman } = useVirtualHumanStore();
  const [transcript, setTranscript] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    setCurrentVirtualHuman(virtualHumanId);
  }, [virtualHumanId]);

  useEffect(() => {
    if (currentVirtualHuman) {
      navigation.setOptions({
        title: `${currentVirtualHuman.name} - 语音聊天`,
      });
    }
  }, [currentVirtualHuman]);

  const handleTranscript = async (text: string) => {
    setTranscript(text);

    // 延迟清除，让用户看到识别结果
    setTimeout(() => setTranscript(''), 2000);

    // 发送消息
    try {
      await sendMessage(virtualHumanId, text, 'voice');
    } catch (error) {
      console.error('Send voice message failed:', error);
    }
  };

  if (!currentVirtualHuman) {
    return <Loading fullScreen />;
  }

  // 获取最近的几条消息
  const recentMessages = messages.slice(-5);

  return (
    <SafeAreaView style={styles.container}>
      {/* 虚拟人头像区域 */}
      <View style={styles.avatarContainer}>
        <Image
          source={
            currentVirtualHuman.avatarUrl
              ? { uri: currentVirtualHuman.avatarUrl }
              : require('@assets/images/default-avatar.png')
          }
          style={styles.avatar}
        />

        {typing && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>正在思考...</Text>
          </View>
        )}
      </View>

      {/* 对话显示区域 */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.transcriptContainer}
        contentContainerStyle={styles.transcriptContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}
      >
        {/* 显示最近的对话 */}
        {recentMessages.map((msg) => (
          <View key={msg.id} style={styles.messageRow}>
            <Text style={styles.messageRole}>
              {msg.role === 'user' ? '你' : currentVirtualHuman.name}:
            </Text>
            <Text style={styles.messageText}>{msg.content}</Text>

            {/* 如果有音频，显示播放器 */}
            {msg.audioUrl && (
              <AudioPlayer
                audioUrl={msg.audioUrl}
                duration={msg.audioDuration}
                autoPlay={msg.role === 'assistant'}
              />
            )}
          </View>
        ))}

        {/* 实时识别文字 */}
        {transcript && (
          <View style={styles.transcriptBox}>
            <Text style={styles.transcriptLabel}>识别结果：</Text>
            <Text style={styles.transcriptText}>{transcript}</Text>
          </View>
        )}
      </ScrollView>

      {/* 语音按钮 */}
      <VoiceButton onTranscript={handleTranscript} disabled={typing} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },

  avatarContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    position: 'relative',
  },

  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.light.border,
  },

  statusBadge: {
    position: 'absolute',
    bottom: Spacing.md,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },

  statusText: {
    color: '#fff',
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },

  transcriptContainer: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },

  transcriptContent: {
    paddingBottom: Spacing.md,
  },

  messageRow: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
  },

  messageRole: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.light.primary,
    marginBottom: Spacing.xs,
  },

  messageText: {
    fontSize: FontSizes.md,
    color: Colors.light.text,
    lineHeight: 22,
  },

  transcriptBox: {
    padding: Spacing.md,
    backgroundColor: Colors.light.info,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },

  transcriptLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: '#fff',
    marginBottom: Spacing.xs,
  },

  transcriptText: {
    fontSize: FontSizes.md,
    color: '#fff',
    lineHeight: 22,
  },
});

export default VoiceChatScreen;
