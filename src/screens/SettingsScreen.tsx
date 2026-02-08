/**
 * 设置界面
 * 提供所有应用配置选项
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '@constants';
import ConfigService, { AppConfig } from '@services/ConfigService';
import ErrorLogService from '@services/ErrorLogService';
import PerformanceMonitorService from '@services/PerformanceMonitorService';
import DataBackupService from '@services/DataBackupService';

export const SettingsScreen: React.FC = () => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      await ConfigService.initialize();
      const currentConfig = ConfigService.getConfig();
      setConfig(currentConfig);
    } catch (error) {
      Alert.alert('错误', '加载配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeature = async (
    feature: keyof AppConfig['features'],
    value: boolean
  ) => {
    try {
      await ConfigService.toggleFeature(feature, value);
      const updatedConfig = ConfigService.getConfig();
      setConfig(updatedConfig);
    } catch (error) {
      Alert.alert('错误', '更新配置失败');
    }
  };

  const handleUpdateApiKey = async (
    service: 'openai' | 'azureSpeech',
    key: string
  ) => {
    try {
      await ConfigService.setApiKey(service, key);
      Alert.alert('成功', 'API 密钥已更新');
    } catch (error) {
      Alert.alert('错误', '更新 API 密钥失败');
    }
  };

  const handleExportConfig = () => {
    try {
      const configJson = ConfigService.exportConfig();
      // 实际应用中应该保存到文件或分享
      console.log('Exported config:', configJson);
      Alert.alert('成功', '配置已导出（查看控制台）');
    } catch (error) {
      Alert.alert('错误', '导出配置失败');
    }
  };

  const handleResetConfig = () => {
    Alert.alert(
      '确认重置',
      '确定要重置所有设置为默认值吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '重置',
          style: 'destructive',
          onPress: async () => {
            try {
              await ConfigService.resetToDefault();
              await loadConfig();
              Alert.alert('成功', '已重置为默认设置');
            } catch (error) {
              Alert.alert('错误', '重置失败');
            }
          },
        },
      ]
    );
  };

  const handleViewLogs = async () => {
    try {
      const report = ErrorLogService.generateErrorReport();
      Alert.alert('错误报告', report);
    } catch (error) {
      Alert.alert('错误', '生成报告失败');
    }
  };

  const handleViewPerformance = () => {
    try {
      const report = PerformanceMonitorService.getPerformanceReport();
      Alert.alert('性能报告', report);
    } catch (error) {
      Alert.alert('错误', '生成报告失败');
    }
  };

  const handleCreateBackup = async () => {
    try {
      const backup = await DataBackupService.createBackup(false);
      Alert.alert(
        '备份成功',
        `备份已创建\n大小: ${(backup.size / 1024 / 1024).toFixed(2)} MB`
      );
    } catch (error) {
      Alert.alert('错误', '创建备份失败');
    }
  };

  if (loading || !config) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 功能开关 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>功能设置</Text>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>语音聊天</Text>
          <Switch
            value={config.features.voiceChat}
            onValueChange={(value) => handleToggleFeature('voiceChat', value)}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>视频聊天</Text>
          <Switch
            value={config.features.videoChat}
            onValueChange={(value) => handleToggleFeature('videoChat', value)}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>照片转3D</Text>
          <Switch
            value={config.features.photoTo3D}
            onValueChange={(value) => handleToggleFeature('photoTo3D', value)}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>音色克隆</Text>
          <Switch
            value={config.features.voiceClone}
            onValueChange={(value) => handleToggleFeature('voiceClone', value)}
          />
        </View>
      </View>

      {/* API 配置 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API 配置</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>OpenAI API Key</Text>
          <TextInput
            style={styles.input}
            placeholder="输入 API 密钥"
            placeholderTextColor={Colors.light.textSecondary}
            value={config.api.openaiApiKey}
            onChangeText={(text) => setConfig({ ...config, api: { ...config.api, openaiApiKey: text } })}
            onBlur={() => handleUpdateApiKey('openai', config.api.openaiApiKey)}
            secureTextEntry
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Azure Speech Key</Text>
          <TextInput
            style={styles.input}
            placeholder="输入 API 密钥"
            placeholderTextColor={Colors.light.textSecondary}
            value={config.api.azureSpeechKey}
            onChangeText={(text) => setConfig({ ...config, api: { ...config.api, azureSpeechKey: text } })}
            onBlur={() => handleUpdateApiKey('azureSpeech', config.api.azureSpeechKey)}
            secureTextEntry
          />
        </View>
      </View>

      {/* 数据管理 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>数据管理</Text>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>自动备份</Text>
          <Switch
            value={config.data.autoBackup}
            onValueChange={async (value) => {
              await ConfigService.set('data', { ...config.data, autoBackup: value });
              await loadConfig();
            }}
          />
        </View>

        <TouchableOpacity style={styles.actionButton} onPress={handleCreateBackup}>
          <Text style={styles.actionButtonText}>立即创建备份</Text>
        </TouchableOpacity>
      </View>

      {/* 界面设置 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>界面设置</Text>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>启用动画</Text>
          <Switch
            value={config.ui.animationsEnabled}
            onValueChange={async (value) => {
              await ConfigService.set('ui', { ...config.ui, animationsEnabled: value });
              await loadConfig();
            }}
          />
        </View>
      </View>

      {/* 开发者选项 */}
      {__DEV__ && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>开发者选项</Text>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>性能监控</Text>
            <Switch
              value={config.performance.enablePerformanceMonitor}
              onValueChange={async (value) => {
                await ConfigService.set('performance', {
                  ...config.performance,
                  enablePerformanceMonitor: value,
                });
                await loadConfig();
              }}
            />
          </View>

          <TouchableOpacity style={styles.actionButton} onPress={handleViewLogs}>
            <Text style={styles.actionButtonText}>查看错误日志</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleViewPerformance}>
            <Text style={styles.actionButtonText}>查看性能报告</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 高级选项 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>高级选项</Text>

        <TouchableOpacity style={styles.actionButton} onPress={handleExportConfig}>
          <Text style={styles.actionButtonText}>导出配置</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.dangerButton]}
          onPress={handleResetConfig}
        >
          <Text style={styles.actionButtonText}>重置所有设置</Text>
        </TouchableOpacity>
      </View>

      {/* 应用信息 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>关于</Text>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>版本</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>平台</Text>
          <Text style={styles.infoValue}>
            {ConfigService.getPlatformConfig().platform}
          </Text>
        </View>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },

  loadingText: {
    fontSize: FontSizes.md,
    color: Colors.light.textSecondary,
  },

  section: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },

  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },

  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },

  settingLabel: {
    fontSize: FontSizes.md,
    color: Colors.light.text,
  },

  inputContainer: {
    marginBottom: Spacing.md,
  },

  inputLabel: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs,
  },

  input: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },

  actionButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },

  dangerButton: {
    backgroundColor: Colors.light.error,
  },

  actionButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: '#fff',
  },

  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },

  infoLabel: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
  },

  infoValue: {
    fontSize: FontSizes.sm,
    color: Colors.light.text,
    fontWeight: '600',
  },

  bottomSpacer: {
    height: Spacing.xl,
  },
});
