/**
 * 创建虚拟人 - 模板选择页面
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useVirtualHumanStore } from '../store';
import { Button, Loading } from '../components';
import { Colors, Spacing, FontSizes, BorderRadius, VIRTUAL_HUMAN_TEMPLATES, BUILTIN_MODELS, BUILTIN_VOICES, BUILTIN_OUTFITS } from '../constants';

type CreateVirtualHumanScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'CreateVirtualHuman'
>;

interface CreateVirtualHumanScreenProps {
  navigation: CreateVirtualHumanScreenNavigationProp;
}

export const CreateVirtualHumanScreen: React.FC<CreateVirtualHumanScreenProps> = ({
  navigation,
}) => {
  const { createVirtualHuman, loading } = useVirtualHumanStore();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isCustom, setIsCustom] = useState(false); // 新增：是否为自定义模式
  const [name, setName] = useState('');
  const [step, setStep] = useState<'template' | 'name'>('template');

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setIsCustom(false);
  };

  // 新增：处理自定义创建
  const handleCustomCreate = () => {
    setSelectedTemplateId(null);
    setIsCustom(true);
    setStep('name');
  };

  const handleNext = () => {
    if (!selectedTemplateId && !isCustom) {
      Alert.alert('提示', '请选择一个模板或点击自定义创建');
      return;
    }
    setStep('name');
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('提示', '请输入虚拟人名字');
      return;
    }

    try {
      let createData;

      if (selectedTemplateId) {
         // 模板创建逻辑
         const template = VIRTUAL_HUMAN_TEMPLATES.find(t => t.id === selectedTemplateId);
         if (!template) return;

         createData = {
          name: name.trim(),
          gender: 'female',
          personality: template.personality,
          backgroundStory: template.backgroundStory,
          modelId: template.modelId,
          voiceId: template.voiceId,
          outfitId: template.outfitId,
          templateId: template.id,
        };
      } else {
         // 自定义创建逻辑 (使用默认值)
         createData = {
          name: name.trim(),
          gender: 'female',
          personality: {
            extroversion: 0.5,
            rationality: 0.5,
            seriousness: 0.5,
            openness: 0.5,
            gentleness: 0.5,
          },
          backgroundStory: '这是一个全新创建的虚拟人。',
          modelId: BUILTIN_MODELS[0]?.id || 'default_model',
          voiceId: BUILTIN_VOICES[0]?.id || 'default_voice',
          outfitId: BUILTIN_OUTFITS[0]?.id || 'default_outfit',
          templateId: null,
        };
      }

      await createVirtualHuman(createData);

      Alert.alert('成功', '虚拟人创建成功！', [
        {
          text: '确定',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Creation failed:', error);
      Alert.alert('错误', `创建失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const renderTemplate = ({ item }: any) => {
    const isSelected = item.id === selectedTemplateId;

    return (
      <TouchableOpacity
        style={[styles.templateCard, isSelected && styles.templateCardSelected]}
        onPress={() => handleTemplateSelect(item.id)}
        activeOpacity={0.7}
      >
        <Image source={item.thumbnailUrl} style={styles.templateImage} />
        <Text style={styles.templateName}>{item.name}</Text>
        <Text style={styles.templateDesc} numberOfLines={2}>
          {item.description}
        </Text>
        {isSelected && (
          <View style={styles.checkMark}>
            <Text style={styles.checkMarkText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <Loading fullScreen message="创建中..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {step === 'template' ? (
        <>
          {/* 模板选择 */}
          <View style={styles.header}>
            <Text style={styles.title}>选择预设模板</Text>
            <Text style={styles.subtitle}>快速创建你的虚拟人</Text>
          </View>

          <FlatList
            data={VIRTUAL_HUMAN_TEMPLATES}
            keyExtractor={item => item.id}
            renderItem={renderTemplate}
            numColumns={2}
            contentContainerStyle={styles.list}
            columnWrapperStyle={styles.row}
          />

          <View style={styles.footer}>
            <Button
              title="自定义创建"
              onPress={handleCustomCreate}
              variant="outline"
              style={{ flex: 1, marginRight: Spacing.sm }}
            />
            <Button
              title="下一步"
              onPress={handleNext}
              variant="primary"
              style={{ flex: 1 }}
              disabled={!selectedTemplateId}
            />
          </View>
        </>
      ) : (
        <>
          {/* 输入名字 */}
          <View style={styles.header}>
            <Text style={styles.title}>给TA起个名字</Text>
            <Text style={styles.subtitle}>这将是你们交流时的称呼</Text>
          </View>

          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="请输入名字"
              value={name}
              onChangeText={setName}
              maxLength={20}
              autoFocus
            />
          </View>

          <View style={styles.footer}>
            <Button
              title="返回"
              onPress={() => setStep('template')}
              variant="outline"
              style={styles.backButton}
            />
            <Button
              title="创建"
              onPress={handleCreate}
              variant="primary"
              style={styles.createButton}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },

  header: {
    padding: Spacing.xl,
    alignItems: 'center',
  },

  title: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },

  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.light.textSecondary,
  },

  list: {
    padding: Spacing.md,
  },

  row: {
    justifyContent: 'space-between',
  },

  templateCard: {
    flex: 1,
    margin: Spacing.sm,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },

  templateCardSelected: {
    borderColor: Colors.light.primary,
  },

  templateImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },

  templateName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },

  templateDesc: {
    fontSize: FontSizes.xs,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },

  checkMark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkMarkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  formContainer: {
    flex: 1,
    padding: Spacing.xl,
  },

  input: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSizes.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },

  footer: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },

  backButton: {
    flex: 1,
    marginRight: Spacing.sm,
  },

  createButton: {
    flex: 2,
  },
});

export default CreateVirtualHumanScreen;
