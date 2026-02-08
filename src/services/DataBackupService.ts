/**
 * 数据备份服务
 * 自动备份和恢复
 */

import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Database from '@database';

export interface BackupMetadata {
  id: string;
  timestamp: number;
  size: number;
  virtualHumanCount: number;
  messageCount: number;
  memoryCount: number;
  auto: boolean; // 是否自动备份
}

export class DataBackupService {
  private readonly BACKUP_DIR = `${RNFS.DocumentDirectoryPath}/backups`;
  private readonly BACKUP_METADATA_KEY = 'backup_metadata';
  private readonly MAX_AUTO_BACKUPS = 7; // 保留最近7个自动备份

  /**
   * 创建完整备份
   */
  async createBackup(auto: boolean = false): Promise<BackupMetadata> {
    try {
      await this.ensureBackupDir();

      const backupId = `backup_${Date.now()}`;
      const dbPath = Database.getDatabasePath();
      const backupPath = `${this.BACKUP_DIR}/${backupId}.db`;

      // 复制数据库文件
      await RNFS.copyFile(dbPath, backupPath);

      // 获取文件信息
      const stat = await RNFS.stat(backupPath);

      // 获取统计信息
      const stats = await this.getDatabaseStats();

      const metadata: BackupMetadata = {
        id: backupId,
        timestamp: Date.now(),
        size: stat.size,
        virtualHumanCount: stats.virtualHumanCount,
        messageCount: stats.messageCount,
        memoryCount: stats.memoryCount,
        auto,
      };

      // 保存元数据
      await this.saveBackupMetadata(metadata);

      // 如果是自动备份，清理旧备份
      if (auto) {
        await this.cleanupOldAutoBackups();
      }

      return metadata;
    } catch (error) {
      console.error('Create backup error:', error);
      throw new Error('创建备份失败');
    }
  }

  /**
   * 恢复备份
   */
  async restoreBackup(backupId: string): Promise<void> {
    try {
      const backupPath = `${this.BACKUP_DIR}/${backupId}.db`;

      // 检查备份文件是否存在
      const exists = await RNFS.exists(backupPath);
      if (!exists) {
        throw new Error('备份文件不存在');
      }

      // 关闭当前数据库连接
      await Database.close();

      // 备份当前数据库（以防恢复失败）
      const currentDbPath = Database.getDatabasePath();
      const tempBackupPath = `${currentDbPath}.temp`;
      await RNFS.copyFile(currentDbPath, tempBackupPath);

      try {
        // 恢复备份
        await RNFS.copyFile(backupPath, currentDbPath);

        // 重新打开数据库
        await Database.open();

        // 删除临时备份
        await RNFS.unlink(tempBackupPath);
      } catch (error) {
        // 恢复失败，还原临时备份
        await RNFS.copyFile(tempBackupPath, currentDbPath);
        await RNFS.unlink(tempBackupPath);
        await Database.open();
        throw error;
      }
    } catch (error) {
      console.error('Restore backup error:', error);
      throw new Error('恢复备份失败');
    }
  }

  /**
   * 获取所有备份
   */
  async getBackups(): Promise<BackupMetadata[]> {
    try {
      const metadataJson = await AsyncStorage.getItem(this.BACKUP_METADATA_KEY);
      if (!metadataJson) {
        return [];
      }

      const allMetadata: BackupMetadata[] = JSON.parse(metadataJson);

      // 验证备份文件是否存在
      const validMetadata: BackupMetadata[] = [];

      for (const metadata of allMetadata) {
        const backupPath = `${this.BACKUP_DIR}/${metadata.id}.db`;
        const exists = await RNFS.exists(backupPath);
        if (exists) {
          validMetadata.push(metadata);
        }
      }

      // 更新元数据（移除不存在的备份）
      if (validMetadata.length !== allMetadata.length) {
        await this.saveAllBackupMetadata(validMetadata);
      }

      return validMetadata.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Get backups error:', error);
      return [];
    }
  }

  /**
   * 删除备份
   */
  async deleteBackup(backupId: string): Promise<void> {
    try {
      const backupPath = `${this.BACKUP_DIR}/${backupId}.db`;

      // 删除备份文件
      const exists = await RNFS.exists(backupPath);
      if (exists) {
        await RNFS.unlink(backupPath);
      }

      // 更新元数据
      const backups = await this.getBackups();
      const updated = backups.filter((b) => b.id !== backupId);
      await this.saveAllBackupMetadata(updated);
    } catch (error) {
      console.error('Delete backup error:', error);
      throw new Error('删除备份失败');
    }
  }

  /**
   * 自动备份
   * 建议每天或每周运行一次
   */
  async autoBackup(): Promise<BackupMetadata | null> {
    try {
      // 检查是否需要备份
      const backups = await this.getBackups();
      const autoBackups = backups.filter((b) => b.auto);

      // 如果最近24小时内已有备份，跳过
      if (autoBackups.length > 0) {
        const latestBackup = autoBackups[0];
        const hoursSinceLastBackup =
          (Date.now() - latestBackup.timestamp) / (1000 * 60 * 60);

        if (hoursSinceLastBackup < 24) {
          console.log('Skip auto backup: recent backup exists');
          return null;
        }
      }

      // 创建自动备份
      return await this.createBackup(true);
    } catch (error) {
      console.error('Auto backup error:', error);
      return null;
    }
  }

  /**
   * 清理旧的自动备份
   */
  private async cleanupOldAutoBackups(): Promise<void> {
    try {
      const backups = await this.getBackups();
      const autoBackups = backups
        .filter((b) => b.auto)
        .sort((a, b) => b.timestamp - a.timestamp);

      // 保留最近的 N 个自动备份
      const toDelete = autoBackups.slice(this.MAX_AUTO_BACKUPS);

      for (const backup of toDelete) {
        await this.deleteBackup(backup.id);
      }
    } catch (error) {
      console.error('Cleanup auto backups error:', error);
    }
  }

  /**
   * 获取数据库统计信息
   */
  private async getDatabaseStats(): Promise<{
    virtualHumanCount: number;
    messageCount: number;
    memoryCount: number;
  }> {
    try {
      const vhResult = await Database.executeSql(
        'SELECT COUNT(*) as count FROM virtual_humans',
        []
      );
      const msgResult = await Database.executeSql(
        'SELECT COUNT(*) as count FROM messages',
        []
      );
      const memResult = await Database.executeSql(
        'SELECT COUNT(*) as count FROM memories',
        []
      );

      return {
        virtualHumanCount: vhResult.rows.item(0).count,
        messageCount: msgResult.rows.item(0).count,
        memoryCount: memResult.rows.item(0).count,
      };
    } catch (error) {
      console.error('Get database stats error:', error);
      return {
        virtualHumanCount: 0,
        messageCount: 0,
        memoryCount: 0,
      };
    }
  }

  /**
   * 保存备份元数据
   */
  private async saveBackupMetadata(metadata: BackupMetadata): Promise<void> {
    const backups = await this.getBackups();
    backups.push(metadata);
    await this.saveAllBackupMetadata(backups);
  }

  /**
   * 保存所有备份元数据
   */
  private async saveAllBackupMetadata(
    metadata: BackupMetadata[]
  ): Promise<void> {
    await AsyncStorage.setItem(
      this.BACKUP_METADATA_KEY,
      JSON.stringify(metadata)
    );
  }

  /**
   * 确保备份目录存在
   */
  private async ensureBackupDir(): Promise<void> {
    const exists = await RNFS.exists(this.BACKUP_DIR);
    if (!exists) {
      await RNFS.mkdir(this.BACKUP_DIR);
    }
  }

  /**
   * 计算总备份大小
   */
  async getTotalBackupSize(): Promise<number> {
    try {
      const backups = await this.getBackups();
      return backups.reduce((total, backup) => total + backup.size, 0);
    } catch (error) {
      console.error('Get total backup size error:', error);
      return 0;
    }
  }

  /**
   * 导出备份到外部存储
   */
  async exportBackup(
    backupId: string,
    destPath: string
  ): Promise<void> {
    try {
      const backupPath = `${this.BACKUP_DIR}/${backupId}.db`;
      const exists = await RNFS.exists(backupPath);

      if (!exists) {
        throw new Error('备份文件不存在');
      }

      await RNFS.copyFile(backupPath, destPath);
    } catch (error) {
      console.error('Export backup error:', error);
      throw new Error('导出备份失败');
    }
  }

  /**
   * 从外部存储导入备份
   */
  async importBackup(sourcePath: string): Promise<BackupMetadata> {
    try {
      await this.ensureBackupDir();

      const backupId = `backup_imported_${Date.now()}`;
      const backupPath = `${this.BACKUP_DIR}/${backupId}.db`;

      // 复制文件
      await RNFS.copyFile(sourcePath, backupPath);

      // 获取文件信息
      const stat = await RNFS.stat(backupPath);

      // 创建元数据（统计信息暂时为0，需要恢复后才能获取）
      const metadata: BackupMetadata = {
        id: backupId,
        timestamp: Date.now(),
        size: stat.size,
        virtualHumanCount: 0,
        messageCount: 0,
        memoryCount: 0,
        auto: false,
      };

      await this.saveBackupMetadata(metadata);

      return metadata;
    } catch (error) {
      console.error('Import backup error:', error);
      throw new Error('导入备份失败');
    }
  }
}

export default new DataBackupService();
