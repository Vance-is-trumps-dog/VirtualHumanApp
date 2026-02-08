/**
 * 外貌设定编辑器
 * 用于选择3D模型、服装和上传照片生成模型
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius, BUILTIN_MODELS, BUILTIN_OUTFITS } from '@constants';
import PhotoTo3DService from '@services/PhotoTo3DService';

interface AppearanceEditorProps {
  modelId: string;
  outfitId: string;
  onChangeModel: (modelId: string) => void;
  onChangeOutfit: (outfitId: string) => void;
}

export const AppearanceEditor: React.FC<AppearanceEditorProps> = ({
  modelId,
  outfitId,
  onChangeModel,
  onChangeOutfit,
}) => {
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const handlePhotoUpload = async () => {
    // 这里应该调用图片选择器
    // const result = await ImagePicker.launchImageLibrary({...});

    Alert.alert(
      '照片生成3D模型',
      '此功能需要集成图片选择器和照片转3D服务。\n\n流程：\n1. 选择正面清晰照片\n2. 上传到服务器生成3D模型\n3. 下载并应用到虚拟人',
      [{ text: '了解' }]
    );
  };

  const handleGenerateFromPhoto = async (photoUri: string) => {
    try {
      setGenerating(true);
      setProgress(0);

      // 开始生成
      const result = await PhotoTo3DService.generateModel(photoUri, {
        style: 'realistic',
        gender: 'auto',
      });

      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 1000);

      // 轮询状态
      let completed = false;
      while (!completed) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        const status = await PhotoTo3DService.checkStatus(result.avatarId);

        if (status.status === 'completed' && status.modelUrl) {
          clearInterval(progressInterval);
          setProgress(100);

          // 下载模型
          const localPath = await PhotoTo3DService.downloadModel(
            status.modelUrl,
            result.avatarId
          );

          // 保存到数据库
          await PhotoTo3DService.saveModelToDatabase({
            id: result.avatarId,
            name: '自定义模型',
            gender: 'female', // 从API结果获取
            modelUrl: localPath,
            thumbnailUrl: status.thumbnailUrl || '',
          });

          // 应用新模型
          onChangeModel(result.avatarId);

          Alert.alert('成功', '3D模型生成完成！');
          completed = true;
        } else if (status.status === 'failed') {
          throw new Error(status.error || '生成失败');
        }
      }
    } catch (error) {
      Alert.alert('错误', '生成3D模型失败，请重试');
    } finally {
      setGenerating(false);
      setProgress(0);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 照片上传区域 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>照片生成</Text>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={handlePhotoUpload}
          disabled={generating}
        >
          <Text style={styles.uploadIcon}>📷</Text>
          <Text style={styles.uploadText}>上传照片生成专属3D模型</Text>
          <Text style={styles.uploadHint}>支持正面清晰照片</Text>
        </TouchableOpacity>

        {generating && (
          <View style={styles.progressContainer}>
            <ActivityIndicator size="small" color={Colors.light.primary} />
            <Text style={styles.progressText}>生成中... {progress}%</Text>
          </View>
        )}
      </View>

      {/* 模型选择 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>选择模型</Text>
        <View style={styles.grid}>
          {BUILTIN_MODELS.map((model) => (
            <TouchableOpacity
              key={model.id}
              style={[
                styles.gridItem,
                modelId === model.id && styles.gridItemActive,
              ]}
              onPress={() => onChangeModel(model.id)}
            >
              <Image
                source={model.thumbnailUrl}
                style={styles.thumbnail}
                resizeMode="cover"
              />
              <View style={styles.gridItemInfo}>
                <Text style={styles.gridItemName}>{model.name}</Text>
                <Text style={styles.gridItemMeta}>
                  {model.gender === 'male' ? '男' : '女'} · {model.style === 'anime' ? '动漫' : '写实'}
                </Text>
              </View>
              {modelId === model.id && (
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 服装选择 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>选择服装</Text>
        <View style={styles.grid}>
          {BUILTIN_OUTFITS.map((outfit) => (
            <TouchableOpacity
              key={outfit.id}
              style={[
                styles.gridItem,
                outfitId === outfit.id && styles.gridItemActive,
              ]}
              onPress={() => onChangeOutfit(outfit.id)}
            >
              <Image
                source={outfit.thumbnailUrl}
                style={styles.thumbnail}
                resizeMode="cover"
              />
              <View style={styles.gridItemInfo}>
                <Text style={styles.gridItemName}>{outfit.name}</Text>
                <View style={styles.colorDots}>
                  {outfit.colors.map((color, index) => (
                    <View
                      key={index}
                      style={[styles.colorDot, { backgroundColor: color }]}
                    />
                  ))}
                </View>
              </View>
              {outfitId === outfit.id && (
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  section: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },

  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },

  uploadButton: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderStyle: 'dashed',
    padding: Spacing.xl,
    alignItems: 'center',
  },

  uploadIcon: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },

  uploadText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },

  uploadHint: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
  },

  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },

  progressText: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },

  gridItem: {
    width: '47%',
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },

  gridItemActive: {
    borderColor: Colors.light.primary,
  },

  thumbnail: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.light.border,
  },

  gridItemInfo: {
    padding: Spacing.sm,
  },

  gridItemName: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },

  gridItemMeta: {
    fontSize: FontSizes.xs,
    color: Colors.light.textSecondary,
  },

  colorDots: {
    flexDirection: 'row',
    gap: 4,
    marginTop: Spacing.xs,
  },

  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },

  selectedBadge: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  selectedBadgeText: {
    color: '#fff',
    fontSize: FontSizes.xs,
    fontWeight: 'bold',
  },
});
