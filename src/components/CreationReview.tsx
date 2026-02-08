/**
 * 创建确认预览组件
 * 显示虚拟人的完整信息供最终确认
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius, BUILTIN_MODELS, BUILTIN_VOICES, BUILTIN_OUTFITS } from '@constants';
import { Personality, Experience } from '@types';

interface CreationReviewProps {
  name: string;
  age: string;
  gender: 'male' | 'female' | 'other';
  occupation: string;
  personality: Personality;
  backgroundStory: string;
  experiences: Experience[];
  modelId: string;
  voiceId: string;
  outfitId: string;
}

export const CreationReview: React.FC<CreationReviewProps> = ({
  name,
  age,
  gender,
  occupation,
  personality,
  backgroundStory,
  experiences,
  modelId,
  voiceId,
  outfitId,
}) => {
  const genderText = gender === 'male' ? '男性' : gender === 'female' ? '女性' : '其他';

  const selectedModel = BUILTIN_MODELS.find(m => m.id === modelId);
  const selectedVoice = BUILTIN_VOICES.find(v => v.id === voiceId);
  const selectedOutfit = BUILTIN_OUTFITS.find(o => o.id === outfitId);

  const personalityDimensions = [
    { key: 'extroversion', label: '外向程度', value: personality.extroversion },
    { key: 'rationality', label: '理性程度', value: personality.rationality },
    { key: 'seriousness', label: '严肃程度', value: personality.seriousness },
    { key: 'openness', label: '开放程度', value: personality.openness },
    { key: 'gentleness', label: '温和程度', value: personality.gentleness },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 基本信息卡片 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>基本信息</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>姓名：</Text>
          <Text style={styles.infoValue}>{name || '未填写'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>年龄：</Text>
          <Text style={styles.infoValue}>{age || '未填写'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>性别：</Text>
          <Text style={styles.infoValue}>{genderText}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>职业：</Text>
          <Text style={styles.infoValue}>{occupation || '未填写'}</Text>
        </View>
      </View>

      {/* 性格特质卡片 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>性格特质</Text>
        {personalityDimensions.map((dim) => (
          <View key={dim.key} style={styles.personalityRow}>
            <Text style={styles.personalityLabel}>{dim.label}</Text>
            <View style={styles.personalityBarContainer}>
              <View
                style={[
                  styles.personalityBar,
                  { width: `${dim.value * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.personalityValue}>
              {(dim.value * 100).toFixed(0)}%
            </Text>
          </View>
        ))}
      </View>

      {/* 背景故事卡片 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>背景故事</Text>
        <Text style={styles.storyText}>
          {backgroundStory || '未填写'}
        </Text>
      </View>

      {/* 人生经历卡片 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>人生经历</Text>
        {experiences.length > 0 ? (
          experiences.map((exp, index) => (
            <View key={index} style={styles.experienceItem}>
              <View style={styles.experienceHeader}>
                <Text style={styles.experienceYear}>{exp.year}</Text>
                <View style={styles.importanceStars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Text
                      key={star}
                      style={[
                        styles.star,
                        star <= exp.importance && styles.starActive,
                      ]}
                    >
                      ★
                    </Text>
                  ))}
                </View>
              </View>
              <Text style={styles.experienceEvent}>{exp.event}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>暂无经历</Text>
        )}
      </View>

      {/* 外貌设定卡片 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>外貌设定</Text>

        {selectedModel && (
          <View style={styles.assetRow}>
            <Image
              source={selectedModel.thumbnailUrl}
              style={styles.assetThumbnail}
              resizeMode="cover"
            />
            <View style={styles.assetInfo}>
              <Text style={styles.assetLabel}>3D模型</Text>
              <Text style={styles.assetName}>{selectedModel.name}</Text>
              <Text style={styles.assetMeta}>
                {selectedModel.gender === 'male' ? '男性' : '女性'} · {selectedModel.style === 'anime' ? '动漫' : '写实'}
              </Text>
            </View>
          </View>
        )}

        {selectedOutfit && (
          <View style={styles.assetRow}>
            <Image
              source={selectedOutfit.thumbnailUrl}
              style={styles.assetThumbnail}
              resizeMode="cover"
            />
            <View style={styles.assetInfo}>
              <Text style={styles.assetLabel}>服装</Text>
              <Text style={styles.assetName}>{selectedOutfit.name}</Text>
            </View>
          </View>
        )}
      </View>

      {/* 声音设定卡片 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>声音设定</Text>
        {selectedVoice ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>音色：</Text>
            <Text style={styles.infoValue}>
              {selectedVoice.displayName} ({selectedVoice.gender === 'male' ? '男' : '女'})
            </Text>
          </View>
        ) : (
          <Text style={styles.emptyText}>未选择音色</Text>
        )}
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

  card: {
    backgroundColor: Colors.light.surface,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },

  cardTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },

  infoRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },

  infoLabel: {
    fontSize: FontSizes.md,
    color: Colors.light.textSecondary,
    width: 80,
  },

  infoValue: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.light.text,
    fontWeight: '500',
  },

  personalityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },

  personalityLabel: {
    fontSize: FontSizes.sm,
    color: Colors.light.text,
    width: 80,
  },

  personalityBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.light.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: Spacing.sm,
  },

  personalityBar: {
    height: '100%',
    backgroundColor: Colors.light.primary,
  },

  personalityValue: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    width: 45,
    textAlign: 'right',
  },

  storyText: {
    fontSize: FontSizes.md,
    color: Colors.light.text,
    lineHeight: 22,
  },

  experienceItem: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },

  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },

  experienceYear: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },

  importanceStars: {
    flexDirection: 'row',
  },

  star: {
    fontSize: FontSizes.sm,
    color: Colors.light.border,
  },

  starActive: {
    color: Colors.light.warning,
  },

  experienceEvent: {
    fontSize: FontSizes.sm,
    color: Colors.light.text,
    lineHeight: 20,
  },

  assetRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },

  assetThumbnail: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.light.border,
  },

  assetInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'center',
  },

  assetLabel: {
    fontSize: FontSizes.xs,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs,
  },

  assetName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },

  assetMeta: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
  },

  emptyText: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    fontStyle: 'italic',
  },

  bottomSpacer: {
    height: Spacing.xl,
  },
});
