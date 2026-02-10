/**
 * App入口文件
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useSettingsStore } from './src/store';
import AppInitializer from './src/utils/AppInitializer';
import EnvironmentValidator from './src/utils/EnvironmentValidator';
import ErrorLogService from './src/services/ErrorLogService';

const App: React.FC = () => {
  const { loadSettings } = useSettingsStore();
  const [initializing, setInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    // 初始化应用
    const initialize = async () => {
      try {
        // ✅ 第一步：验证环境变量
        EnvironmentValidator.validateOrThrow();

        // ✅ 第二步：使用统一的初始化器
        await AppInitializer.initialize();

        // ✅ 第三步：加载设置
        await loadSettings();

        setInitializing(false);
      } catch (error) {
        console.error('App initialization failed:', error);
        ErrorLogService.fatal('应用启动失败', error as Error, 'App');
        setInitError(
          error instanceof Error
            ? error.message
            : '应用启动失败，请重启应用'
        );
        setInitializing(false);
      }
    };

    initialize();

    // 清理函数
    return () => {
      AppInitializer.cleanup();
    };
  }, []);

  // 初始化中显示加载界面
  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200EE" />
        <Text style={styles.loadingText}>初始化中...</Text>
      </View>
    );
  }

  // 初始化失败显示错误
  if (initError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>❌</Text>
        <Text style={styles.errorMessage}>{initError}</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#6200EE" />
      <RootNavigator />
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#757575',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 32,
  },
  errorText: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorMessage: {
    fontSize: 16,
    color: '#B00020',
    textAlign: 'center',
  },
});

export default App;
