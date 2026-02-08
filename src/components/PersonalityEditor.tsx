/**
 * 性格设定组件
 * 5个维度的滑块调节
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Colors, Spacing, FontSizes } from '@constants';
import { Personality } from '@types';

interface PersonalityEditorProps {
  personality: Personality;
  onChange: (personality: Personality) => void;
}

const PERSONALITY_DIMENSIONS = [
  {
    key: 'extroversion' as keyof Personality,
    label: '外向程度',
    left: '内向',
    right: '外向',
    description: '喜欢社交和主动聊天的程度',
  },
  {
    key: 'rationality' as keyof Personality,
    label: '理性程度',
    left: '感性',
    right: '理性',
    description: '重视逻辑分析还是情感直觉',
  },
  {
    key: 'seriousness' as keyof Personality,
    label: '严肃程度',
    left: '幽默',
    right: '严肃',
    description: '说话风格的正式程度',
  },
  {
    key: 'openness' as keyof Personality,
    label: '开放程度',
    left: '保守',
    right: '开放',
    description: '对新事物的接受程度',
  },
  {
    key: 'gentleness' as keyof Personality,
    label: '温柔程度',
    left: '强势',
    right: '温柔',
    description: '说话的柔和温和程度',
  },
];

export const PersonalityEditor: React.FC<PersonalityEditorProps> = ({
  personality,
  onChange,
}) => {
  const handleChange = (key: keyof Personality, value: number) => {
    onChange({
      ...personality,
      [key]: value,
    });
  };

  return (
    <View style={styles.container}>
      {PERSONALITY_DIMENSIONS.map((dimension) => (
        <View key={dimension.key} style={styles.dimensionContainer}>
          <View style={styles.header}>
            <Text style={styles.label}>{dimension.label}</Text>
            <Text style={styles.value}>
              {Math.round(personality[dimension.key] * 100)}%
            </Text>
          </View>

          <Text style={styles.description}>{dimension.description}</Text>

          <View style={styles.sliderContainer}>
            <Text style={styles.leftLabel}>{dimension.left}</Text>

            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              step={0.01}
              value={personality[dimension.key]}
              onValueChange={(value) => handleChange(dimension.key, value)}
              minimumTrackTintColor={Colors.light.primary}
              maximumTrackTintColor={Colors.light.border}
              thumbTintColor={Colors.light.primary}
            />

            <Text style={styles.rightLabel}>{dimension.right}</Text>
          </View>

          {/* 可视化指示器 */}
          <View style={styles.indicator}>
            <View
              style={[
                styles.indicatorFill,
                { width: `${personality[dimension.key] * 100}%` },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
  },

  dimensionContainer: {
    marginBottom: Spacing.xl,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },

  label: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.light.text,
  },

  value: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },

  description: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
  },

  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  leftLabel: {
    fontSize: FontSizes.xs,
    color: Colors.light.textSecondary,
    width: 40,
  },

  slider: {
    flex: 1,
  },

  rightLabel: {
    fontSize: FontSizes.xs,
    color: Colors.light.textSecondary,
    width: 40,
    textAlign: 'right',
  },

  indicator: {
    height: 4,
    backgroundColor: Colors.light.border,
    borderRadius: 2,
    marginTop: Spacing.xs,
    overflow: 'hidden',
  },

  indicatorFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
  },
});
