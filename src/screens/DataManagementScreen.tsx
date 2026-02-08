/**
 * 数据管理界面
 * 提供导出、导入、备份、统计等功能
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '@constants';
import DataExportService from '@services/DataExportService';
import DataImportService from '@services/DataImportService';
import DataBackupService, { BackupMetadata } from '@services/DataBackupService';
import DataStatisticsService from '@services/DataStatisticsService';

interface DataManagementScreenProps {
  virtualHumanId?: string; // 如果提供，则显示单个虚拟人的管理；否则显示全局管理
}

export const DataManagementScreen: React.FC<DataManagementScreenProps> = ({
  virtualHumanId,
}) => {
  const [loading, setLoading] = useState(false);
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [exportedFiles, setExportedFiles] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [virtualHumanId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // 加载备份列表
      const backupList = await DataBackupService.getBackups();
      setBackups(backupList);

      // 加载导出文件列表
      const fileList = await DataExportService.getExportedFiles();
      setExportedFiles(fileList);

      // 加载统计数据
      if (virtualHumanId) {
        const stats = await DataStatisticsService.getVirtualHumanStatistics(
          virtualHumanId
        );
        setStatistics(stats);
      } else {
        const stats = await DataStatisticsService.getAppStatistics();
        setStatistics(stats);
      }
    } catch (error) {
      console.error('Load data error:', error);
      Alert.alert('错误', '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 导出数据
  const handleExport = async (format: 'json' | 'txt') => {
    try {
      setLoading(true);

      let filePath: string;

      if (virtualHumanId) {
        filePath = await DataExportService.exportVirtualHuman(virtualHumanId, {
          includeMessages: true,
          includeMemories: true,
          format,
        });
      } else {
        filePath = await DataExportService.exportAll({ format });
      }

      Alert.alert(
        '导出成功',
        `文件已保存到：${filePath}`,
        [
          { text: '确定' },
          {
            text: '分享',
            onPress: () => DataExportService.shareExportedFile(filePath),
          },
        ]
      );

      loadData();
    } catch (error) {
      Alert.alert('错误', '导出失败');
    } finally {
      setLoading(false);
    }
  };

  // 导入数据
  const handleImport = async () => {
    // 实际应用中，这里应该打开文件选择器
    Alert.alert('提示', '请选择要导入的文件（需要集成文件选择器）');

    // 示例代码：
    // const file = await DocumentPicker.pick({ type: [DocumentPicker.types.allFiles] });
    // const result = await DataImportService.importFromFile(file.uri);
    // if (result.success) {
    //   Alert.alert('成功', `已导入 ${result.statistics.messagesImported} 条消息和 ${result.statistics.memoriesImported} 条记忆`);
    // }
  };

  // 创建备份
  const handleCreateBackup = async () => {
    try {
      setLoading(true);

      const backup = await DataBackupService.createBackup(false);

      Alert.alert(
        '备份成功',
        `备份已创建\n大小：${(backup.size / 1024 / 1024).toFixed(2)} MB`
      );

      loadData();
    } catch (error) {
      Alert.alert('错误', '创建备份失败');
    } finally {
      setLoading(false);
    }
  };

  // 恢复备份
  const handleRestoreBackup = (backupId: string) => {
    Alert.alert(
      '确认恢复',
      '恢复备份将覆盖当前所有数据，是否继续？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '恢复',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await DataBackupService.restoreBackup(backupId);
              Alert.alert('成功', '数据已恢复');
              loadData();
            } catch (error) {
              Alert.alert('错误', '恢复备份失败');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // 删除备份
  const handleDeleteBackup = (backupId: string) => {
    Alert.alert('确认删除', '确定要删除这个备份吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await DataBackupService.deleteBackup(backupId);
            loadData();
          } catch (error) {
            Alert.alert('错误', '删除备份失败');
          }
        },
      },
    ]);
  };

  // 分享导出文件
  const handleShareFile = async (filePath: string) => {
    try {
      await DataExportService.shareExportedFile(filePath);
    } catch (error) {
      Alert.alert('错误', '分享失败');
    }
  };

  if (loading && !statistics) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 统计概览 */}
      {statistics && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 数据统计</Text>
          <View style={styles.statsCard}>
            {virtualHumanId ? (
              <>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>总消息数：</Text>
                  <Text style={styles.statValue}>{statistics.messages.total}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>总记忆数：</Text>
                  <Text style={styles.statValue}>{statistics.memories.total}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>活跃天数：</Text>
                  <Text style={styles.statValue}>{statistics.engagement.activeDays}</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>虚拟人数量：</Text>
                  <Text style={styles.statValue}>
                    {statistics.overview.totalVirtualHumans}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>总消息数：</Text>
                  <Text style={styles.statValue}>
                    {statistics.overview.totalMessages}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>总记忆数：</Text>
                  <Text style={styles.statValue}>
                    {statistics.overview.totalMemories}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      )}

      {/* 导出 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📤 数据导出</Text>
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleExport('json')}
          >
            <Text style={styles.actionButtonText}>导出为 JSON</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleExport('txt')}
          >
            <Text style={styles.actionButtonText}>导出为文本</Text>
          </TouchableOpacity>
        </View>

        {/* 导出文件列表 */}
        {exportedFiles.length > 0 && (
          <View style={styles.fileList}>
            <Text style={styles.listTitle}>最近导出：</Text>
            {exportedFiles.slice(0, 3).map((file) => (
              <TouchableOpacity
                key={file.path}
                style={styles.fileItem}
                onPress={() => handleShareFile(file.path)}
              >
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName}>{file.name}</Text>
                  <Text style={styles.fileSize}>
                    {(file.size / 1024).toFixed(1)} KB
                  </Text>
                </View>
                <Text style={styles.shareIcon}>📤</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* 导入 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📥 数据导入</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleImport}
        >
          <Text style={styles.actionButtonText}>从文件导入</Text>
        </TouchableOpacity>
      </View>

      {/* 备份 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💾 数据备份</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleCreateBackup}
        >
          <Text style={styles.actionButtonText}>创建备份</Text>
        </TouchableOpacity>

        {/* 备份列表 */}
        {backups.length > 0 && (
          <View style={styles.backupList}>
            <Text style={styles.listTitle}>备份列表：</Text>
            {backups.map((backup) => (
              <View key={backup.id} style={styles.backupItem}>
                <View style={styles.backupInfo}>
                  <Text style={styles.backupDate}>
                    {new Date(backup.timestamp).toLocaleString()}
                  </Text>
                  <Text style={styles.backupSize}>
                    {(backup.size / 1024 / 1024).toFixed(2)} MB
                    {backup.auto && ' (自动)'}
                  </Text>
                </View>
                <View style={styles.backupActions}>
                  <TouchableOpacity
                    style={styles.backupButton}
                    onPress={() => handleRestoreBackup(backup.id)}
                  >
                    <Text style={styles.backupButtonText}>恢复</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.backupButton, styles.deleteButton]}
                    onPress={() => handleDeleteBackup(backup.id)}
                  >
                    <Text style={styles.backupButtonText}>删除</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
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

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },

  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.light.textSecondary,
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

  statsCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },

  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },

  statLabel: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
  },

  statValue: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.light.text,
  },

  buttonGroup: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },

  actionButton: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },

  actionButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: '#fff',
  },

  fileList: {
    marginTop: Spacing.md,
  },

  backupList: {
    marginTop: Spacing.md,
  },

  listTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },

  fileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },

  fileInfo: {
    flex: 1,
  },

  fileName: {
    fontSize: FontSizes.sm,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },

  fileSize: {
    fontSize: FontSizes.xs,
    color: Colors.light.textSecondary,
  },

  shareIcon: {
    fontSize: FontSizes.lg,
  },

  backupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },

  backupInfo: {
    flex: 1,
  },

  backupDate: {
    fontSize: FontSizes.sm,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },

  backupSize: {
    fontSize: FontSizes.xs,
    color: Colors.light.textSecondary,
  },

  backupActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },

  backupButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.sm,
  },

  deleteButton: {
    backgroundColor: Colors.light.error,
  },

  backupButtonText: {
    fontSize: FontSizes.xs,
    color: '#fff',
    fontWeight: '600',
  },

  bottomSpacer: {
    height: Spacing.xl,
  },
});
