/**
 * 虚拟人详情页面
 * 显示虚拟人的详细信息和管理选项
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useVirtualHumanStore } from '../store';
import { Colors, Spacing, FontSizes, BorderRadius } from '../constants';
import { VirtualHuman } from '../types';
import { Button, Loading } from '../components';

type VirtualHumanDetailScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'VirtualHumanDetail'
>;

type VirtualHumanDetailScreenRouteProp = RouteProp<
  RootStackParamList,
  'VirtualHumanDetail'
>;

interface VirtualHumanDetailScreenProps {
  navigation: VirtualHumanDetailScreenNavigationProp;
  route: VirtualHumanDetailScreenRouteProp;
}

// 性格特质标签映射
const getTraitLabel = (key: string): string => {
  const labels: Record<string, string> = {
    extroversion: '外向程度',
    rationality: '理性程度',
    seriousness: '严肃程度',
    openness: '开放程度',
    gentleness: '温和程度',
  };
  return labels[key] || key;
};

export const VirtualHumanDetailScreen: React.FC<
  VirtualHumanDetailScreenProps
> = ({ navigation, route }) => {
  const { virtualHumanId } = route.params;
  const { virtualHumans, deleteVirtualHuman } = useVirtualHumanStore();
  const [virtualHuman, setVirtualHuman] = useState<VirtualHuman | null>(null);

  useEffect(() => {
    const vh = virtualHumans.find((v) => v.id === virtualHumanId);
    setVirtualHuman(vh || null);
  }, [virtualHumanId, virtualHumans]);

  const handleDelete = () => {
    Alert.alert(
      '确认删除',
      `确定要删除 ${virtualHuman?.name} 吗？所有对话记录将被清除。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVirtualHuman(virtualHumanId);
              Alert.alert('成功', '已删除');
              navigation.goBack();
            } catch (error) {
              Alert.alert('错误', '删除失败');
            }
          },
        },
      ]
    );
  };

  const handleChat = () => {
    navigation.navigate('Chat', { virtualHumanId });
  };

  const handleVoiceChat = () => {
    navigation.navigate('VoiceChat', { virtualHumanId });
  };

  const handleVideoChat = () => {
    navigation.navigate('VideoChat', { virtualHumanId });
  };

  const handleIntelligence = () => {
    navigation.navigate('Intelligence', { virtualHumanId });
  };

  const handleDataManagement = () => {
    navigation.navigate('DataManagement', { virtualHumanId });
  };

  if (!virtualHuman) {
    return <Loading fullScreen message="加载中..." />;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 头像和基本信息 */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {virtualHuman.name.charAt(0)}
          </Text>
        </View>
        <Text style={styles.name}>{virtualHuman.name}</Text>
        {virtualHuman.age && (
          <Text style={styles.info}>{virtualHuman.age} 岁</Text>
        )}
        {virtualHuman.occupation && (
          <Text style={styles.info}>{virtualHuman.occupation}</Text>
        )}
      </View>

      {/* 统计信息 */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {virtualHuman.totalMessages || 0}
          </Text>
          <Text style={styles.statLabel}>消息数</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {virtualHuman.totalInteractions || 0}
          </Text>
          <Text style={styles.statLabel}>互动次数</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {virtualHuman.last_interaction
              ? new Date(virtualHuman.last_interaction).toLocaleDateString()
              : '从未'}
          </Text>
          <Text style={styles.statLabel}>最近互动</Text>
        </View>
      </View>

      {/* 背景故事 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>背景故事</Text>
        <Text style={styles.sectionContent}>
          {virtualHuman.backgroundStory}
        </Text>
      </View>

      {/* 性格特质 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>性格特质</Text>
        {Object.entries(virtualHuman.personality).map(([key, value]) => (
          <View key={key} style={styles.traitRow}>
            <Text style={styles.traitLabel}>
              {getTraitLabel(key)}
            </Text>
            <View style={styles.traitBarContainer}>
              <View
                style={[
                  styles.traitBar,
                  { width: `${(value as number) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.traitValue}>
              {((value as number) * 100).toFixed(0)}%
            </Text>
          </View>
        ))}
      </View>

      {/* 操作按钮 */}
      <View style={styles.actions}>
        <Button
          title="💬 文字对话"
          onPress={handleChat}
          variant="primary"
          fullWidth
          style={styles.actionButton}
        />
        <Button
          title="🎤 语音对话"
          onPress={handleVoiceChat}
          variant="secondary"
          fullWidth
          style={styles.actionButton}
        />
        <Button
          title="📹 视频对话"
          onPress={handleVideoChat}
          variant="secondary"
          fullWidth
          style={styles.actionButton}
        />
        <Button
          title="🧠 智能分析"
          onPress={handleIntelligence}
          variant="outline"
          fullWidth
          style={styles.actionButton}
        />
        <Button
          title="💾 数据管理"
          onPress={handleDataManagement}
          variant="outline"
          fullWidth
          style={styles.actionButton}
        />
        <Button
          title="🗑️ 删除虚拟人"
          onPress={handleDelete}
          variant="outline"
          fullWidth
          style={[styles.actionButton, styles.deleteButton]}
        />
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

  header: {
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.light.surface,
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },

  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },

  name: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },

  info: {
    fontSize: FontSizes.md,
    color: Colors.light.textSecondary,
  },

  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surface,
    marginTop: Spacing.md,
    padding: Spacing.lg,
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
  },

  statDivider: {
    width: 1,
    backgroundColor: Colors.light.border,
  },

  statValue: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: Spacing.xs,
  },

  statLabel: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
  },

  section: {
    padding: Spacing.md,
    marginTop: Spacing.md,
  },

  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },

  sectionContent: {
    fontSize: FontSizes.md,
    color: Colors.light.text,
    lineHeight: 22,
  },

  traitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },

  traitLabel: {
    fontSize: FontSizes.sm,
    color: Colors.light.text,
    width: 80,
  },

  traitBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.light.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: Spacing.sm,
  },

  traitBar: {
    height: '100%',
    backgroundColor: Colors.light.primary,
  },

  traitValue: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    width: 45,
    textAlign: 'right',
  },

  actions: {
    padding: Spacing.md,
  },

  actionButton: {
    marginBottom: Spacing.sm,
  },

  deleteButton: {
    borderColor: Colors.light.error,
  },

  bottomSpacer: {
    height: Spacing.xl,
  },
});

export default VirtualHumanDetailScreen;
