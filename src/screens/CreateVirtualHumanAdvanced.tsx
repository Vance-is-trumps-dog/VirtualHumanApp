/**
 * 完整的虚拟人创建流程
 * 多步骤表单
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@navigation/RootNavigator';
import { useVirtualHumanStore } from '@store';
import {
  Button,
  Loading,
  PersonalityEditor,
  BackstoryEditor,
  TimelineEditor,
  BasicInfoEditor,
  AppearanceEditor,
  VoiceSelector,
  CreationReview,
} from '@components';
import { Colors, Spacing, FontSizes, BorderRadius } from '@constants';
import { Personality, Experience } from '@types';

type CreateVirtualHumanAdvancedScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'CreateVirtualHuman'
>;

interface CreateVirtualHumanAdvancedScreenProps {
  navigation: CreateVirtualHumanAdvancedScreenNavigationProp;
}

type Step = 'basic' | 'personality' | 'backstory' | 'timeline' | 'appearance' | 'voice' | 'review';

const STEPS: { key: Step; label: string }[] = [
  { key: 'basic', label: '基本信息' },
  { key: 'personality', label: '性格特质' },
  { key: 'backstory', label: '背景故事' },
  { key: 'timeline', label: '人生经历' },
  { key: 'appearance', label: '外貌设定' },
  { key: 'voice', label: '声音设定' },
  { key: 'review', label: '确认创建' },
];

export const CreateVirtualHumanAdvancedScreen: React.FC<
  CreateVirtualHumanAdvancedScreenProps
> = ({ navigation }) => {
  const { createVirtualHuman, loading } = useVirtualHumanStore();

  const [currentStep, setCurrentStep] = useState<Step>('basic');
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'female' as 'male' | 'female' | 'other',
    occupation: '',
    personality: {
      extroversion: 0.5,
      rationality: 0.5,
      seriousness: 0.5,
      openness: 0.5,
      gentleness: 0.5,
    } as Personality,
    backgroundStory: '',
    experiences: [] as Experience[],
    modelId: 'model_female_1',
    voiceId: 'zh-CN-XiaoxiaoNeural',
    outfitId: 'outfit_casual_1',
  });

  const currentStepIndex = STEPS.findIndex(s => s.key === currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const handleNext = () => {
    // 验证当前步骤
    if (!validateCurrentStep()) {
      return;
    }

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].key);
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].key);
    }
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 'basic':
        if (!formData.name.trim()) {
          Alert.alert('提示', '请输入名字');
          return false;
        }
        return true;

      case 'personality':
        return true;

      case 'backstory':
        if (!formData.backgroundStory.trim()) {
          Alert.alert('提示', '请输入背景故事');
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const handleCreate = async () => {
    try {
      await createVirtualHuman({
        name: formData.name,
        age: formData.age ? parseInt(formData.age) : undefined,
        gender: formData.gender,
        occupation: formData.occupation,
        personality: formData.personality,
        backgroundStory: formData.backgroundStory,
        modelId: formData.modelId,
        voiceId: formData.voiceId,
        outfitId: formData.outfitId,
      });

      Alert.alert('成功', '虚拟人创建成功！', [
        {
          text: '确定',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert('错误', '创建失败，请重试');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>基本信息</Text>
            <BasicInfoEditor
              name={formData.name}
              age={formData.age}
              gender={formData.gender}
              occupation={formData.occupation}
              onChangeName={(name) => setFormData({ ...formData, name })}
              onChangeAge={(age) => setFormData({ ...formData, age })}
              onChangeGender={(gender) => setFormData({ ...formData, gender })}
              onChangeOccupation={(occupation) => setFormData({ ...formData, occupation })}
            />
          </View>
        );

      case 'personality':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>性格特质</Text>
            <PersonalityEditor
              personality={formData.personality}
              onChange={(personality) =>
                setFormData({ ...formData, personality })
              }
            />
          </View>
        );

      case 'backstory':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>背景故事</Text>
            <BackstoryEditor
              value={formData.backgroundStory}
              onChange={(backgroundStory) =>
                setFormData({ ...formData, backgroundStory })
              }
            />
          </View>
        );

      case 'timeline':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>人生经历</Text>
            <TimelineEditor
              experiences={formData.experiences}
              onChange={(experiences) =>
                setFormData({ ...formData, experiences })
              }
            />
          </View>
        );

      case 'appearance':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>外貌设定</Text>
            <AppearanceEditor
              modelId={formData.modelId}
              outfitId={formData.outfitId}
              onChangeModel={(modelId) => setFormData({ ...formData, modelId })}
              onChangeOutfit={(outfitId) => setFormData({ ...formData, outfitId })}
            />
          </View>
        );

      case 'voice':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>声音设定</Text>
            <VoiceSelector
              voiceId={formData.voiceId}
              gender={formData.gender}
              onChange={(voiceId) => setFormData({ ...formData, voiceId })}
            />
          </View>
        );

      case 'review':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>确认信息</Text>
            <CreationReview
              name={formData.name}
              age={formData.age}
              gender={formData.gender}
              occupation={formData.occupation}
              personality={formData.personality}
              backgroundStory={formData.backgroundStory}
              experiences={formData.experiences}
              modelId={formData.modelId}
              voiceId={formData.voiceId}
              outfitId={formData.outfitId}
            />
          </View>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return <Loading fullScreen message="创建中..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 进度指示器 */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          步骤 {currentStepIndex + 1}/{STEPS.length}
        </Text>
      </View>

      {/* 步骤内容 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>

      {/* 底部按钮 */}
      <View style={styles.footer}>
        {currentStepIndex > 0 && (
          <Button
            title="上一步"
            onPress={handlePrevious}
            variant="outline"
            style={styles.button}
          />
        )}

        {currentStepIndex < STEPS.length - 1 ? (
          <Button
            title="下一步"
            onPress={handleNext}
            variant="primary"
            style={styles.button}
          />
        ) : (
          <Button
            title="创建"
            onPress={handleCreate}
            variant="primary"
            style={styles.button}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },

  progressContainer: {
    padding: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },

  progressBar: {
    height: 4,
    backgroundColor: Colors.light.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },

  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
  },

  progressText: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },

  content: {
    flex: 1,
  },

  stepContent: {
    padding: Spacing.md,
  },

  stepTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: Spacing.lg,
  },

  placeholder: {
    fontSize: FontSizes.md,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginVertical: Spacing.xl,
  },

  footer: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
  },

  button: {
    flex: 1,
  },
});

export default CreateVirtualHumanAdvancedScreen;
