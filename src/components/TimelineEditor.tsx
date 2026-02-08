/**
 * 时间线编辑器
 * 用于记录人物经历
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '@constants';
import { Experience } from '@types';

interface TimelineEditorProps {
  experiences: Experience[];
  onChange: (experiences: Experience[]) => void;
}

export const TimelineEditor: React.FC<TimelineEditorProps> = ({
  experiences,
  onChange,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempYear, setTempYear] = useState('');
  const [tempEvent, setTempEvent] = useState('');
  const [tempImportance, setTempImportance] = useState(3);

  const handleAdd = () => {
    setEditingIndex(-1);
    setTempYear('');
    setTempEvent('');
    setTempImportance(3);
  };

  const handleSave = () => {
    const year = parseInt(tempYear);
    if (isNaN(year) || !tempEvent.trim()) {
      Alert.alert('提示', '请填写完整信息');
      return;
    }

    const newExperience: Experience = {
      year,
      event: tempEvent.trim(),
      importance: tempImportance,
    };

    if (editingIndex === -1) {
      // 添加新项
      const updated = [...experiences, newExperience].sort((a, b) => a.year - b.year);
      onChange(updated);
    } else if (editingIndex !== null) {
      // 编辑现有项
      const updated = [...experiences];
      updated[editingIndex] = newExperience;
      onChange(updated.sort((a, b) => a.year - b.year));
    }

    setEditingIndex(null);
  };

  const handleEdit = (index: number) => {
    const exp = experiences[index];
    setEditingIndex(index);
    setTempYear(exp.year.toString());
    setTempEvent(exp.event);
    setTempImportance(exp.importance);
  };

  const handleDelete = (index: number) => {
    Alert.alert('确认删除', '确定要删除这条经历吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          const updated = experiences.filter((_, i) => i !== index);
          onChange(updated);
        },
      },
    ]);
  };

  const handleCancel = () => {
    setEditingIndex(null);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 时间线列表 */}
        {experiences.map((exp, index) => (
          <View key={index} style={styles.timelineItem}>
            <View style={styles.timelineDot}>
              <View style={[styles.dot, { opacity: exp.importance / 5 }]} />
              {index < experiences.length - 1 && <View style={styles.line} />}
            </View>

            <View style={styles.timelineContent}>
              <View style={styles.timelineHeader}>
                <Text style={styles.year}>{exp.year}</Text>
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => handleEdit(index)}>
                    <Text style={styles.actionText}>编辑</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(index)}>
                    <Text style={[styles.actionText, styles.deleteText]}>删除</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.event}>{exp.event}</Text>

              <View style={styles.importanceBar}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <View
                    key={level}
                    style={[
                      styles.importanceLevel,
                      level <= exp.importance && styles.importanceLevelActive,
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>
        ))}

        {/* 编辑表单 */}
        {editingIndex !== null && (
          <View style={styles.editForm}>
            <Text style={styles.formTitle}>
              {editingIndex === -1 ? '添加经历' : '编辑经历'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="年份"
              placeholderTextColor={Colors.light.textSecondary}
              value={tempYear}
              onChangeText={setTempYear}
              keyboardType="number-pad"
              maxLength={4}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="事件描述"
              placeholderTextColor={Colors.light.textSecondary}
              value={tempEvent}
              onChangeText={setTempEvent}
              multiline
              maxLength={100}
            />

            <View style={styles.importanceContainer}>
              <Text style={styles.importanceLabel}>重要性：</Text>
              <View style={styles.importanceSelector}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.importanceButton,
                      tempImportance >= level && styles.importanceButtonActive,
                    ]}
                    onPress={() => setTempImportance(level)}
                  >
                    <Text
                      style={[
                        styles.importanceButtonText,
                        tempImportance >= level && styles.importanceButtonTextActive,
                      ]}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 添加按钮 */}
      {editingIndex === null && (
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addButtonText}>+ 添加经历</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
  },

  scrollView: {
    flex: 1,
  },

  timelineItem: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },

  timelineDot: {
    width: 30,
    alignItems: 'center',
  },

  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.light.primary,
  },

  line: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.light.border,
    marginTop: Spacing.xs,
  },

  timelineContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },

  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },

  year: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },

  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },

  actionText: {
    fontSize: FontSizes.sm,
    color: Colors.light.primary,
  },

  deleteText: {
    color: Colors.light.error,
  },

  event: {
    fontSize: FontSizes.md,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },

  importanceBar: {
    flexDirection: 'row',
    gap: 4,
  },

  importanceLevel: {
    width: 20,
    height: 4,
    backgroundColor: Colors.light.border,
    borderRadius: 2,
  },

  importanceLevelActive: {
    backgroundColor: Colors.light.primary,
  },

  editForm: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },

  formTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },

  input: {
    backgroundColor: Colors.light.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.sm,
  },

  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  importanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },

  importanceLabel: {
    fontSize: FontSizes.md,
    color: Colors.light.text,
    marginRight: Spacing.sm,
  },

  importanceSelector: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },

  importanceButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  importanceButtonActive: {
    backgroundColor: Colors.light.primary,
  },

  importanceButtonText: {
    fontSize: FontSizes.md,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },

  importanceButtonTextActive: {
    color: '#fff',
  },

  formActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },

  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
  },

  cancelButtonText: {
    fontSize: FontSizes.md,
    color: Colors.light.text,
    fontWeight: '600',
  },

  saveButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
  },

  saveButtonText: {
    fontSize: FontSizes.md,
    color: '#fff',
    fontWeight: '600',
  },

  addButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },

  addButtonText: {
    fontSize: FontSizes.md,
    color: '#fff',
    fontWeight: '600',
  },
});
