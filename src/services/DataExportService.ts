/**
 * 数据导出服务
 * 导出虚拟人和对话数据
 */

import RNFS from 'react-native-fs';
import { Share } from 'react-native';
import VirtualHumanDAO from '@database/VirtualHumanDAO';
import MessageDAO from '@database/MessageDAO';
import MemoryDAO from '@database/MemoryDAO';
import { VirtualHuman, Message, Memory } from '@types';

export interface ExportOptions {
  includeMessages?: boolean;
  includeMemories?: boolean;
  messageLimit?: number;
  format?: 'json' | 'txt';
}

export interface ExportData {
  version: string;
  exportDate: number;
  virtualHuman: VirtualHuman;
  messages?: Message[];
  memories?: Memory[];
  statistics: {
    totalMessages: number;
    totalMemories: number;
    conversationDays: number;
  };
}

export class DataExportService {
  private readonly EXPORT_VERSION = '1.0';
  private readonly EXPORT_DIR = `${RNFS.DocumentDirectoryPath}/exports`;

  /**
   * 导出单个虚拟人的完整数据
   */
  async exportVirtualHuman(
    virtualHumanId: string,
    options: ExportOptions = {}
  ): Promise<string> {
    const {
      includeMessages = true,
      includeMemories = true,
      messageLimit = 1000,
      format = 'json',
    } = options;

    try {
      // 1. 获取虚拟人信息
      const virtualHuman = await VirtualHumanDAO.getById(virtualHumanId);
      if (!virtualHuman) {
        throw new Error('Virtual human not found');
      }

      // 2. 构建导出数据
      const exportData: ExportData = {
        version: this.EXPORT_VERSION,
        exportDate: Date.now(),
        virtualHuman,
        statistics: {
          totalMessages: 0,
          totalMemories: 0,
          conversationDays: 0,
        },
      };

      // 3. 导出消息（如果需要）
      if (includeMessages) {
        const messages = await MessageDAO.getChatHistory(
          virtualHumanId,
          messageLimit
        );
        exportData.messages = messages;
        exportData.statistics.totalMessages = messages.length;

        // 计算对话天数
        if (messages.length > 0) {
          const sorted = messages.sort((a, b) => a.created_at - b.created_at);
          const firstDate = sorted[0].created_at;
          const lastDate = sorted[sorted.length - 1].created_at;
          exportData.statistics.conversationDays = Math.ceil(
            (lastDate - firstDate) / (1000 * 60 * 60 * 24)
          );
        }
      }

      // 4. 导出记忆（如果需要）
      if (includeMemories) {
        const memories = await MemoryDAO.getAll(virtualHumanId);
        exportData.memories = memories;
        exportData.statistics.totalMemories = memories.length;
      }

      // 5. 确保导出目录存在
      await this.ensureExportDir();

      // 6. 生成文件
      const fileName = this.generateFileName(virtualHuman.name, format);
      const filePath = `${this.EXPORT_DIR}/${fileName}`;

      if (format === 'json') {
        await this.exportAsJSON(filePath, exportData);
      } else {
        await this.exportAsText(filePath, exportData);
      }

      return filePath;
    } catch (error) {
      console.error('Export error:', error);
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(`导出失败: ${msg}`);
    }
  }

  /**
   * 导出为 JSON 格式
   */
  private async exportAsJSON(
    filePath: string,
    data: ExportData
  ): Promise<void> {
    const jsonString = JSON.stringify(data, null, 2);
    await RNFS.writeFile(filePath, jsonString, 'utf8');
  }

  /**
   * 导出为可读文本格式
   */
  private async exportAsText(
    filePath: string,
    data: ExportData
  ): Promise<void> {
    let text = `虚拟人数据导出\n`;
    text += `导出时间: ${new Date(data.exportDate).toLocaleString()}\n`;
    text += `版本: ${data.version}\n\n`;

    // 虚拟人信息
    text += `=== 虚拟人信息 ===\n`;
    text += `姓名: ${data.virtualHuman.name}\n`;
    text += `年龄: ${data.virtualHuman.age || '未设置'}\n`;
    text += `性别: ${this.getGenderText(data.virtualHuman.gender)}\n`;
    text += `职业: ${data.virtualHuman.occupation || '未设置'}\n`;
    text += `背景故事: ${data.virtualHuman.backgroundStory}\n\n`;

    // 统计信息
    text += `=== 统计信息 ===\n`;
    text += `总消息数: ${data.statistics.totalMessages}\n`;
    text += `总记忆数: ${data.statistics.totalMemories}\n`;
    text += `对话天数: ${data.statistics.conversationDays}\n\n`;

    // 对话记录
    if (data.messages && data.messages.length > 0) {
      text += `=== 对话记录 ===\n\n`;
      const sortedMessages = data.messages.sort(
        (a, b) => a.created_at - b.created_at
      );

      sortedMessages.forEach((msg) => {
        const time = new Date(msg.created_at).toLocaleString();
        const role = msg.role === 'user' ? '用户' : data.virtualHuman.name;
        text += `[${time}] ${role}:\n${msg.content}\n\n`;
      });
    }

    // 记忆
    if (data.memories && data.memories.length > 0) {
      text += `=== 记忆 ===\n\n`;
      data.memories.forEach((mem, index) => {
        text += `${index + 1}. [${this.getCategoryText(mem.category)}] ${mem.content}\n`;
        if (mem.context) {
          text += `   背景: ${mem.context}\n`;
        }
        text += `   重要性: ${mem.importance}/5\n\n`;
      });
    }

    await RNFS.writeFile(filePath, text, 'utf8');
  }

  /**
   * 分享导出的文件
   */
  async shareExportedFile(filePath: string): Promise<void> {
    try {
      await Share.share({
        url: `file://${filePath}`,
        title: '分享虚拟人数据',
      });
    } catch (error) {
      console.error('Share error:', error);
      throw new Error('分享失败');
    }
  }

  /**
   * 批量导出所有虚拟人
   */
  async exportAll(options: ExportOptions = {}): Promise<string> {
    try {
      const allVirtualHumans = await VirtualHumanDAO.getAll();

      const exportData = {
        version: this.EXPORT_VERSION,
        exportDate: Date.now(),
        virtualHumans: [] as ExportData[],
      };

      for (const vh of allVirtualHumans) {
        const vhData = await this.exportVirtualHumanData(vh.id, options);
        exportData.virtualHumans.push(vhData);
      }

      await this.ensureExportDir();
      const fileName = `all_virtual_humans_${Date.now()}.json`;
      const filePath = `${this.EXPORT_DIR}/${fileName}`;

      await RNFS.writeFile(
        filePath,
        JSON.stringify(exportData, null, 2),
        'utf8'
      );

      return filePath;
    } catch (error) {
      console.error('Export all error:', error);
      throw new Error('批量导出失败');
    }
  }

  /**
   * 获取虚拟人数据（不写入文件）
   */
  private async exportVirtualHumanData(
    virtualHumanId: string,
    options: ExportOptions
  ): Promise<ExportData> {
    const virtualHuman = await VirtualHumanDAO.getById(virtualHumanId);
    if (!virtualHuman) {
      throw new Error('Virtual human not found');
    }

    const exportData: ExportData = {
      version: this.EXPORT_VERSION,
      exportDate: Date.now(),
      virtualHuman,
      statistics: {
        totalMessages: 0,
        totalMemories: 0,
        conversationDays: 0,
      },
    };

    if (options.includeMessages) {
      const messages = await MessageDAO.getChatHistory(
        virtualHumanId,
        options.messageLimit || 1000
      );
      exportData.messages = messages;
      exportData.statistics.totalMessages = messages.length;
    }

    if (options.includeMemories) {
      const memories = await MemoryDAO.getAll(virtualHumanId);
      exportData.memories = memories;
      exportData.statistics.totalMemories = memories.length;
    }

    return exportData;
  }

  /**
   * 删除导出文件
   */
  async deleteExportFile(filePath: string): Promise<void> {
    try {
      const exists = await RNFS.exists(filePath);
      if (exists) {
        await RNFS.unlink(filePath);
      }
    } catch (error) {
      console.error('Delete file error:', error);
      throw new Error('删除文件失败');
    }
  }

  /**
   * 获取所有导出文件列表
   */
  async getExportedFiles(): Promise<
    Array<{
      name: string;
      path: string;
      size: number;
      modifiedTime: number;
    }>
  > {
    try {
      await this.ensureExportDir();

      const files = await RNFS.readDir(this.EXPORT_DIR);

      return files
        .filter((file) => !file.isDirectory())
        .map((file) => ({
          name: file.name,
          path: file.path,
          size: file.size,
          modifiedTime: parseInt(file.mtime as any),
        }))
        .sort((a, b) => b.modifiedTime - a.modifiedTime);
    } catch (error) {
      console.error('Get files error:', error);
      return [];
    }
  }

  /**
   * 清理旧的导出文件
   */
  async cleanupOldExports(daysToKeep: number = 30): Promise<number> {
    try {
      const files = await this.getExportedFiles();
      const cutoffTime = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;

      let deleted = 0;
      for (const file of files) {
        if (file.modifiedTime < cutoffTime) {
          await this.deleteExportFile(file.path);
          deleted++;
        }
      }

      return deleted;
    } catch (error) {
      console.error('Cleanup error:', error);
      return 0;
    }
  }

  /**
   * 确保导出目录存在
   */
  private async ensureExportDir(): Promise<void> {
    const exists = await RNFS.exists(this.EXPORT_DIR);
    if (!exists) {
      await RNFS.mkdir(this.EXPORT_DIR);
    }
  }

  /**
   * 生成文件名
   */
  private generateFileName(name: string, format: 'json' | 'txt'): string {
    const timestamp = Date.now();
    const safeName = name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    return `${safeName}_${timestamp}.${format}`;
  }

  /**
   * 辅助方法
   */
  private getGenderText(gender: string): string {
    const map: Record<string, string> = {
      male: '男性',
      female: '女性',
      other: '其他',
    };
    return map[gender] || gender;
  }

  private getCategoryText(category: string): string {
    const map: Record<string, string> = {
      basic_info: '基本信息',
      preferences: '偏好',
      experiences: '经历',
      relationships: '关系',
      other: '其他',
    };
    return map[category] || category;
  }
}

export default new DataExportService();
