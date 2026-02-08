/**
 * 设置页面
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Switch,
} from 'react-native';
import { useSettingsStore } from '@store';
import { Colors, Spacing, FontSizes, BorderRadius } from '@constants';

export const SettingsScreen: React.FC = () => {
  const {
    theme,
    voiceVolume,
    voiceSpeed,
    autoPlay,
    videoQuality,
    updateSettings,
  } = useSettingsStore();

  const SettingItem: React.FC<{
    title: string;
    value?: string;
    onPress?: () => void;
    showArrow?: boolean;
  }> = ({ title, value, onPress, showArrow = false }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} disabled={!onPress}>
      <Text style={styles.settingTitle}>{title}</Text>
      <View style={styles.settingRight}>
        {value && <Text style={styles.settingValue}>{value}</Text>}
        {showArrow && <Text style={styles.arrow}>›</Text>}
      </View>
    </TouchableOpacity>
  );

  const SettingSwitch: React.FC<{
    title: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }> = ({ title, value, onValueChange }) => (
    <View style={styles.settingItem}>
      <Text style={styles.settingTitle}>{title}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.light.border, true: Colors.light.primary }}
      />
    </View>
  );

  const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <SectionHeader title="通用设置" />
        <View style={styles.section}>
          <SettingItem
            title="主题模式"
            value={theme === 'auto' ? '跟随系统' : theme === 'light' ? '浅色' : '深色'}
            showArrow
          />
          <SettingItem title="语言" value="简体中文" showArrow />
        </View>

        <SectionHeader title="语音设置" />
        <View style={styles.section}>
          <SettingItem title="音量" value={`${Math.round(voiceVolume * 100)}%`} showArrow />
          <SettingItem title="语速" value={`${voiceSpeed}x`} showArrow />
          <SettingSwitch
            title="自动播放语音"
            value={autoPlay}
            onValueChange={value => updateSettings({ autoPlay: value })}
          />
        </View>

        <SectionHeader title="视频设置" />
        <View style={styles.section}>
          <SettingItem
            title="渲染质量"
            value={
              videoQuality === 'high' ? '高' : videoQuality === 'medium' ? '中' : '低'
            }
            showArrow
          />
        </View>

        <SectionHeader title="隐私与安全" />
        <View style={styles.section}>
          <SettingItem title="数据与隐私" showArrow />
          <SettingItem title="清除缓存" showArrow />
        </View>

        <SectionHeader title="关于" />
        <View style={styles.section}>
          <SettingItem title="版本" value="1.0.0" />
          <SettingItem title="帮助与反馈" showArrow />
          <SettingItem title="用户协议" showArrow />
          <SettingItem title="隐私政策" showArrow />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },

  sectionHeader: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xs,
    textTransform: 'uppercase',
  },

  section: {
    backgroundColor: Colors.light.surface,
    marginBottom: Spacing.md,
  },

  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },

  settingTitle: {
    fontSize: FontSizes.md,
    color: Colors.light.text,
  },

  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  settingValue: {
    fontSize: FontSizes.md,
    color: Colors.light.textSecondary,
    marginRight: Spacing.xs,
  },

  arrow: {
    fontSize: 24,
    color: Colors.light.textSecondary,
  },
});

export default SettingsScreen;
