/**
 * Unity视图组件
 * 封装Unity渲染视图
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
// import UnityView from '@azesmway/react-native-unity';
import UnityBridge from '@services/UnityBridge';
import { Emotion } from '@types';

interface UnityViewComponentProps {
  modelId: string;
  outfitId?: string;
  backgroundId?: string;
  emotion?: Emotion;
  style?: ViewStyle;
  onReady?: () => void;
  onError?: (error: string) => void;
}

export const UnityViewComponent: React.FC<UnityViewComponentProps> = ({
  modelId,
  outfitId,
  backgroundId,
  emotion,
  style,
  onReady,
  onError,
}) => {
  const [isReady, setIsReady] = useState(false);
  const unityRef = useRef<any>(null);

  useEffect(() => {
    // 监听Unity就绪事件
    UnityBridge.onMessage('modelLoaded', () => {
      setIsReady(true);
      onReady?.();
    });

    // 监听错误事件
    UnityBridge.onMessage('error', (error) => {
      onError?.(error);
    });

    return () => {
      UnityBridge.offMessage('modelLoaded');
      UnityBridge.offMessage('error');
    };
  }, []);

  useEffect(() => {
    // 当Unity就绪后，加载模型
    if (isReady) {
      UnityBridge.switchModel(modelId);
    }
  }, [isReady, modelId]);

  useEffect(() => {
    // 更换服装
    if (isReady && outfitId) {
      UnityBridge.changeOutfit(outfitId);
    }
  }, [isReady, outfitId]);

  useEffect(() => {
    // 更换背景
    if (isReady && backgroundId) {
      UnityBridge.setBackground(backgroundId);
    }
  }, [isReady, backgroundId]);

  useEffect(() => {
    // 设置情绪
    if (isReady && emotion) {
      UnityBridge.setEmotion(emotion);
    }
  }, [isReady, emotion]);

  // 由于react-native-unity可能未安装，这里用占位符
  return (
    <View style={[styles.container, style]}>
      {/* <UnityView
        ref={unityRef}
        style={styles.unityView}
        onUnityMessage={(message) => {
          console.log('Unity message:', message);
        }}
      /> */}

      {/* 临时占位符 - 显示3D预览图 */}
      <View style={styles.placeholder}>
        <View style={styles.placeholderText}>
          {/* 这里将来会是Unity 3D视图 */}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  unityView: {
    flex: 1,
  },

  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },

  placeholderText: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#333',
  },
});
