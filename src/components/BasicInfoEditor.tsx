/**
 * 基本信息编辑器
 * 用于输入虚拟人的基本信息
 */

import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '@constants';

interface BasicInfoEditorProps {
  name: string;
  age: string;
  gender: 'male' | 'female' | 'other';
  occupation: string;
  onChangeName: (value: string) => void;
  onChangeAge: (value: string) => void;
  onChangeGender: (value: 'male' | 'female' | 'other') => void;
  onChangeOccupation: (value: string) => void;
}

export const BasicInfoEditor: React.FC<BasicInfoEditorProps> = ({
  name,
  age,
  gender,
  occupation,
  onChangeName,
  onChangeAge,
  onChangeGender,
  onChangeOccupation,
}) => {
  const genderOptions: Array<{ value: 'male' | 'female' | 'other'; label: string }> = [
    { value: 'female', label: '女性' },
    { value: 'male', label: '男性' },
    { value: 'other', label: '其他' },
  ];

  return (
    <View style={styles.container}>
      {/* 姓名输入 */}
      <View style={styles.field}>
        <Text style={styles.label}>姓名 *</Text>
        <TextInput
          style={styles.input}
          placeholder="请输入姓名"
          placeholderTextColor={Colors.light.textSecondary}
          value={name}
          onChangeText={onChangeName}
          maxLength={20}
        />
      </View>

      {/* 年龄输入 */}
      <View style={styles.field}>
        <Text style={styles.label}>年龄</Text>
        <TextInput
          style={styles.input}
          placeholder="请输入年龄（选填）"
          placeholderTextColor={Colors.light.textSecondary}
          value={age}
          onChangeText={onChangeAge}
          keyboardType="number-pad"
          maxLength={3}
        />
      </View>

      {/* 性别选择 */}
      <View style={styles.field}>
        <Text style={styles.label}>性别 *</Text>
        <View style={styles.genderContainer}>
          {genderOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.genderButton,
                gender === option.value && styles.genderButtonActive,
              ]}
              onPress={() => onChangeGender(option.value)}
            >
              <Text
                style={[
                  styles.genderButtonText,
                  gender === option.value && styles.genderButtonTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 职业输入 */}
      <View style={styles.field}>
        <Text style={styles.label}>职业</Text>
        <TextInput
          style={styles.input}
          placeholder="请输入职业（选填）"
          placeholderTextColor={Colors.light.textSecondary}
          value={occupation}
          onChangeText={onChangeOccupation}
          maxLength={30}
        />
      </View>

      <Text style={styles.hint}>* 为必填项</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
  },

  field: {
    marginBottom: Spacing.lg,
  },

  label: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: Spacing.sm,
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

  genderContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },

  genderButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
  },

  genderButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },

  genderButtonText: {
    fontSize: FontSizes.md,
    color: Colors.light.text,
    fontWeight: '600',
  },

  genderButtonTextActive: {
    color: '#fff',
  },

  hint: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    marginTop: Spacing.sm,
  },
});
