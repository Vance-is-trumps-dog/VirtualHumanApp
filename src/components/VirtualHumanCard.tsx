/**
 * 虚拟人卡片组件
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { VirtualHuman } from '../types';
import { Colors, Spacing, FontSizes, BorderRadius } from '../constants';
import { timeAgo } from '../utils/helpers';

interface VirtualHumanCardProps {
  virtualHuman: VirtualHuman;
  onPress: () => void;
  onLongPress?: () => void;
}

export const VirtualHumanCard: React.FC<VirtualHumanCardProps> = ({
  virtualHuman,
  onPress,
  onLongPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      {/* 头像 */}
      <Image
        source={
          virtualHuman.avatarUrl
            ? { uri: virtualHuman.avatarUrl }
            : { uri: 'https://via.placeholder.com/150' }
        }
        style={styles.avatar}
      />

      {/* 信息 */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {virtualHuman.name}
        </Text>

        <Text style={styles.meta} numberOfLines={1}>
          {virtualHuman.age && `${virtualHuman.age}岁`}
          {virtualHuman.age && virtualHuman.occupation && ' · '}
          {virtualHuman.occupation}
        </Text>

        <Text style={styles.stats}>
          对话 {virtualHuman.totalMessages} 次
          {virtualHuman.lastInteraction && (
            <Text style={styles.time}>
              {' · '}
              {timeAgo(virtualHuman.lastInteraction)}
            </Text>
          )}
        </Text>
      </View>

      {/* 箭头指示器 */}
      <View style={styles.arrow}>
        <Text style={styles.arrowText}>›</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.border,
  },

  info: {
    flex: 1,
    marginLeft: Spacing.md,
  },

  name: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },

  meta: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },

  stats: {
    fontSize: FontSizes.xs,
    color: Colors.light.textSecondary,
  },

  time: {
    color: Colors.light.primary,
  },

  arrow: {
    marginLeft: Spacing.sm,
  },

  arrowText: {
    fontSize: 24,
    color: Colors.light.textSecondary,
  },
});
