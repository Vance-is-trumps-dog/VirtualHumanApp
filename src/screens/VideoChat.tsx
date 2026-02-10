/**
 * 视频聊天页面（3D虚拟人）
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useChatStore, useVirtualHumanStore, useSettingsStore } from '../store';
import { UnityViewComponent } from '../components/UnityView';
import { VoiceButton, Loading } from '../components';
import { Colors, Spacing, FontSizes, BorderRadius } from '../constants';
import UnityBridge from '../services/UnityBridge';
import SpeechService from '../services/SpeechService';
import { Emotion } from '../types';

type VideoChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;
type VideoChatScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Chat'>;

interface VideoChatScreenProps {
  route: VideoChatScreenRouteProp;
  navigation: VideoChatScreenNavigationProp;
}

export const VideoChatScreen: React.FC<VideoChatScreenProps> = ({ route, navigation }) => {
  const { virtualHumanId } = route.params;
  const { messages, typing, sendMessage } = useChatStore();
  const { currentVirtualHuman, setCurrentVirtualHuman } = useVirtualHumanStore();
  const { autoPlay } = useSettingsStore();

  const [currentEmotion, setCurrentEmotion] = useState<Emotion>('neutral');
  const [showSubtitle, setShowSubtitle] = useState(true);
  const [currentText, setCurrentText] = useState('');
  const [unityReady, setUnityReady] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    setCurrentVirtualHuman(virtualHumanId);
  }, [virtualHumanId]);

  useEffect(() => {
    if (currentVirtualHuman) {
      navigation.setOptions({
        title: `${currentVirtualHuman.name} - 视频聊天`,
      });
    }
  }, [currentVirtualHuman]);

  // 监听最新消息，更新情绪和字幕
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage) {
      setCurrentText(lastMessage.content);

      // 更新情绪
      if (lastMessage.emotion) {
        setCurrentEmotion(lastMessage.emotion);
      }

      // 如果是AI回复且有语音，播放并同步口型
      if (
        lastMessage.role === 'assistant' &&
        lastMessage.audioUrl &&
        autoPlay &&
        unityReady
      ) {
        handlePlayAudioWithLipSync(lastMessage.audioUrl, lastMessage.content);
      }
    }
  }, [messages, unityReady]);

  const handlePlayAudioWithLipSync = async (audioUrl: string, text: string) => {
    try {
      // 发送到Unity进行口型同步
      await UnityBridge.playAudioWithLipSync(audioUrl, text);
    } catch (error) {
      console.error('Play audio with lip sync failed:', error);
    }
  };

  const handleVoiceTranscript = async (text: string) => {
    setCurrentText(text);

    try {
      await sendMessage(virtualHumanId, text, 'video');
    } catch (error) {
      console.error('Send message failed:', error);
    }
  };

  const handleUnityReady = () => {
    setUnityReady(true);
    console.log('Unity is ready');
  };

  const handleUnityError = (error: string) => {
    console.error('Unity error:', error);
  };

  const toggleSubtitle = () => {
    setShowSubtitle(!showSubtitle);
  };

  if (!currentVirtualHuman) {
    return <Loading fullScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Unity 3D视图 */}
      <View style={styles.unityContainer}>
        <UnityViewComponent
          modelId={currentVirtualHuman.modelId}
          outfitId={currentVirtualHuman.outfitId}
          emotion={currentEmotion}
          onReady={handleUnityReady}
          onError={handleUnityError}
          style={styles.unityView}
        />

        {/* 字幕显示 */}
        {showSubtitle && currentText && (
          <View style={styles.subtitleContainer}>
            <Text style={styles.subtitleText}>{currentText}</Text>
          </View>
        )}

        {/* 打字指示器 */}
        {typing && (
          <View style={styles.typingBadge}>
            <Text style={styles.typingText}>思考中...</Text>
          </View>
        )}

        {/* 控制栏 */}
        <View style={styles.controlBar}>
          <TouchableOpacity style={styles.controlButton} onPress={toggleSubtitle}>
            <Text style={styles.controlIcon}>{showSubtitle ? '💬' : '🔇'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => UnityBridge.setCameraView('full')}
          >
            <Text style={styles.controlIcon}>👤</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => UnityBridge.setCameraView('upper')}
          >
            <Text style={styles.controlIcon}>👔</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => UnityBridge.setCameraView('face')}
          >
            <Text style={styles.controlIcon}>😊</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 语音输入 */}
      <VoiceButton onTranscript={handleVoiceTranscript} disabled={typing || !unityReady} />

      {/* 对话历史（可折叠） */}
      <View style={styles.historyContainer}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.historyScroll}
          contentContainerStyle={styles.historyContent}
        >
          {messages.slice(-3).map((msg) => (
            <View key={msg.id} style={styles.historyItem}>
              <Text style={styles.historyRole}>
                {msg.role === 'user' ? '你' : currentVirtualHuman.name}:
              </Text>
              <Text style={styles.historyText}>{msg.content}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },

  unityContainer: {
    flex: 1,
    position: 'relative',
  },

  unityView: {
    flex: 1,
  },

  subtitleContainer: {
    position: 'absolute',
    bottom: 80,
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },

  subtitleText: {
    color: '#fff',
    fontSize: FontSizes.lg,
    textAlign: 'center',
    lineHeight: 24,
  },

  typingBadge: {
    position: 'absolute',
    top: Spacing.md,
    alignSelf: 'center',
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },

  typingText: {
    color: '#fff',
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },

  controlBar: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    flexDirection: 'column',
  },

  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },

  controlIcon: {
    fontSize: 20,
  },

  historyContainer: {
    maxHeight: 120,
    backgroundColor: Colors.light.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },

  historyScroll: {
    flex: 1,
  },

  historyContent: {
    padding: Spacing.sm,
  },

  historyItem: {
    marginBottom: Spacing.xs,
  },

  historyRole: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.light.primary,
    marginBottom: 2,
  },

  historyText: {
    fontSize: FontSizes.sm,
    color: Colors.light.text,
  },
});

export default VideoChatScreen;
