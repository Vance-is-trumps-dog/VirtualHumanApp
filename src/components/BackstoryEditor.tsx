/**
 * 背景故事编辑器
 * 支持富文本输入和AI辅助生成
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '@constants';
import AIService from '@services/AIService';

interface BackstoryEditorProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

export const BackstoryEditor: React.FC<BackstoryEditorProps> = ({
  value,
  onChange,
  maxLength = 500,
}) => {
  const [generating, setGenerating] = useState(false);

  const handleAIGenerate = async () => {
    Alert.prompt(
      'AI辅助生成',
      '请输入关键词（用逗号分隔）',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '生成',
          onPress: async (keywords) => {
            if (!keywords || !keywords.trim()) {
              return;
            }

            setGenerating(true);
            try {
              const keywordList = keywords.split(/[,，、]/).map(k => k.trim()).filter(k => k);
              const backstory = await AIService.generateBackstory(keywordList);
              onChange(backstory);
            } catch (error) {
              Alert.alert('错误', '生成失败，请重试');
            } finally {
              setGenerating(false);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const templates = [
    {
      label: '学生',
      content: '我是一名在校大学生，主修计算机科学。平时喜欢编程、看书和运动。性格开朗，喜欢交朋友，对新技术充满好奇。',
    },
    {
      label: '职场',
      content: '我是一名职场人士，从事互联网行业。工作认真负责，注重效率和团队协作。业余时间喜欢健身、旅游和摄影。',
    },
    {
      label: '艺术',
      content: '我热爱艺术创作，擅长绘画和音乐。性格浪漫感性，喜欢用艺术表达情感。希望能通过创作影响和感动更多人。',
    },
  ];

  return (
    <View style={styles.container}>
      {/* 快捷模板 */}
      <View style={styles.templatesContainer}>
        <Text style={styles.templatesLabel}>快捷模板：</Text>
        <View style={styles.templates}>
          {templates.map((template) => (
            <TouchableOpacity
              key={template.label}
              style={styles.templateButton}
              onPress={() => onChange(template.content)}
            >
              <Text style={styles.templateText}>{template.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 文本输入 */}
      <TextInput
        style={styles.input}
        placeholder="请输入背景故事..."
        placeholderTextColor={Colors.light.textSecondary}
        value={value}
        onChangeText={onChange}
        multiline
        maxLength={maxLength}
        textAlignVertical="top"
      />

      {/* 字数统计 */}
      <View style={styles.footer}>
        <Text style={styles.counter}>
          {value.length} / {maxLength}
        </Text>

        <TouchableOpacity
          style={[styles.aiButton, generating && styles.aiButtonDisabled]}
          onPress={handleAIGenerate}
          disabled={generating}
        >
          {generating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.aiButtonText}>✨ AI生成</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
  },

  templatesContainer: {
    marginBottom: Spacing.md,
  },

  templatesLabel: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs,
  },

  templates: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },

  templateButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },

  templateText: {
    fontSize: FontSizes.sm,
    color: Colors.light.text,
  },

  input: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.light.text,
    minHeight: 200,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },

  counter: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
  },

  aiButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },

  aiButtonDisabled: {
    opacity: 0.5,
  },

  aiButtonText: {
    color: '#fff',
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
});
