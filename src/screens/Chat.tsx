/**
 * 聊天页面（更新版 - 支持语音模式切换）
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Text,
  Alert,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@navigation/RootNavigator';
import { useChatStore, useVirtualHumanStore, useSettingsStore } from '@store';
import { MessageBubble, Loading, VoiceButton, AudioPlayer } from '@components';
import { Colors, Spacing, FontSizes, BorderRadius } from '@constants';
import SpeechService from '@services/SpeechService';

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;
type ChatScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Chat'>;

interface ChatScreenProps {
  route: ChatScreenRouteProp;
  navigation: ChatScreenNavigationProp;
}

type ChatMode = 'text' | 'voice';

export const ChatScreen: React.FC<ChatScreenProps> = ({ route, navigation }) => {
  const { virtualHumanId } = route.params;
  const { messages, loading, typing, loadMessages, sendMessage } = useChatStore();
  const { currentVirtualHuman, setCurrentVirtualHuman } = useVirtualHumanStore();
  const { autoPlay, voiceSpeed } = useSettingsStore();

  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState<ChatMode>('text');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    setCurrentVirtualHuman(virtualHumanId);
    loadMessages(virtualHumanId);
  }, [virtualHumanId]);

  useEffect(() => {
    // 设置导航标题
    if (currentVirtualHuman) {
      navigation.setOptions({
        title: currentVirtualHuman.name,
        headerRight: () => (
          <TouchableOpacity
            style={styles.modeButton}
            onPress={() => setMode(m => (m === 'text' ? 'voice' : 'text'))}
          >
            <Text style={styles.modeButtonText}>
              {mode === 'text' ? '🎤' : '⌨️'}
            </Text>
          </TouchableOpacity>
        ),
      });
    }
  }, [currentVirtualHuman, mode]);

  useEffect(() => {
    // 滚动到底部
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // 自动播放AI回复的语音
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage &&
      lastMessage.role === 'assistant' &&
      lastMessage.mode === 'voice' &&
      lastMessage.audioUrl &&
      autoPlay
    ) {
      // 延迟一下再播放
      setTimeout(() => {
        playAudio(lastMessage.audioUrl!);
      }, 500);
    }
  }, [messages]);

  const playAudio = async (audioUrl: string) => {
    try {
      // 这里可以集成AudioPlayer组件的播放逻辑
      console.log('Auto playing audio:', audioUrl);
    } catch (error) {
      console.error('Auto play failed:', error);
    }
  };

  const handleSendText = async () => {
    const text = inputText.trim();
    if (!text || typing) {
      return;
    }

    setInputText('');

    try {
      await sendMessage(virtualHumanId, text, mode);

      // 如果是语音模式，生成AI回复的语音
      if (mode === 'voice' && currentVirtualHuman) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          // 异步生成语音，不阻塞
          SpeechService.textToSpeech(
            lastMessage.content,
            currentVirtualHuman.voiceId,
            voiceSpeed
          ).catch(err => console.error('TTS failed:', err));
        }
      }
    } catch (error) {
      Alert.alert('错误', '发送失败，请重试');
    }
  };

  const handleVoiceTranscript = async (text: string) => {
    try {
      await sendMessage(virtualHumanId, text, 'voice');
    } catch (error) {
      Alert.alert('错误', '发送失败，请重试');
    }
  };

  if (loading && messages.length === 0) {
    return <Loading fullScreen message="加载聊天记录..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* 消息列表 */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View>
              <MessageBubble message={item} />
              {/* 如果消息有音频，显示播放器 */}
              {item.audioUrl && (
                <View
                  style={[
                    styles.audioPlayerContainer,
                    item.role === 'user' && styles.audioPlayerRight,
                  ]}
                >
                  <AudioPlayer
                    audioUrl={item.audioUrl}
                    duration={item.audioDuration}
                    autoPlay={item.role === 'assistant' && autoPlay}
                  />
                </View>
              )}
            </View>
          )}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />

        {/* 打字指示器 */}
        {typing && (
          <View style={styles.typingIndicator}>
            <Text style={styles.typingText}>对方正在输入...</Text>
          </View>
        )}

        {/* 输入区域 */}
        {mode === 'text' ? (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="输入消息..."
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!typing}
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || typing) && styles.sendButtonDisabled,
              ]}
              onPress={handleSendText}
              disabled={!inputText.trim() || typing}
            >
              <Text style={styles.sendButtonText}>发送</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <VoiceButton onTranscript={handleVoiceTranscript} disabled={typing} />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },

  keyboardView: {
    flex: 1,
  },

  messageList: {
    paddingVertical: Spacing.md,
  },

  audioPlayerContainer: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
  },

  audioPlayerRight: {
    alignItems: 'flex-end',
  },

  typingIndicator: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },

  typingText: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    fontStyle: 'italic',
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },

  input: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.md,
    maxHeight: 100,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },

  sendButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },

  sendButtonDisabled: {
    opacity: 0.5,
  },

  sendButtonText: {
    color: '#fff',
    fontSize: FontSizes.md,
    fontWeight: '600',
  },

  modeButton: {
    marginRight: Spacing.md,
  },

  modeButtonText: {
    fontSize: 24,
  },
});

export default ChatScreen;
