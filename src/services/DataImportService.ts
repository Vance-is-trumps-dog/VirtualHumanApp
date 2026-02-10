/**
 * 数据导入服务
 * 导入虚拟人和对话数据
 */

import RNFS from 'react-native-fs';
import VirtualHumanDAO from '@database/VirtualHumanDAO';
import MessageDAO from '@database/MessageDAO';
import MemoryDAO from '@database/MemoryDAO';
import { VirtualHuman } from '@types';
import { ExportData } from './DataExportService';

export interface ImportOptions {
  overwrite?: boolean; // 如果已存在，是否覆盖
  importMessages?: boolean;
  importMemories?: boolean;
}

export interface ImportResult {
  success: boolean;
  virtualHumanId?: string;
  statistics: {
    messagesImported: number;
    memoriesImported: number;
  };
  errors: string[];
}

export class DataImportService {
  /**
   * 从文件导入虚拟人数据
   */
  async importFromFile(
    filePath: string,
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    const {
      overwrite = false,
      importMessages = true,
      importMemories = true,
    } = options;

    const result: ImportResult = {
      success: false,
      statistics: {
        messagesImported: 0,
        memoriesImported: 0,
      },
      errors: [],
    };

    try {
      // 1. 读取文件
      const fileContent = await RNFS.readFile(filePath, 'utf8');
      const data: ExportData = JSON.parse(fileContent);

      // 2. 验证数据格式
      if (!this.validateExportData(data)) {
        result.errors.push('数据格式不正确');
        return result;
      }

      // 3. 检查是否已存在同名虚拟人
      const existingVH = await VirtualHumanDAO.getByName(
        data.virtualHuman.name
      );

      let virtualHumanId: string;

      if (existingVH) {
        if (!overwrite) {
          result.errors.push('已存在同名虚拟人，请选择覆盖或重命名');
          return result;
        }

        // 覆盖模式：删除旧数据
        await VirtualHumanDAO.delete(existingVH.id);
        virtualHumanId = existingVH.id;
      } else {
        virtualHumanId = data.virtualHuman.id;
      }

      // 4. 导入虚拟人基本信息
      await VirtualHumanDAO.create({
        name: data.virtualHuman.name,
        age: data.virtualHuman.age,
        gender: data.virtualHuman.gender,
        occupation: data.virtualHuman.occupation,
        personality: data.virtualHuman.personality,
        backgroundStory: data.virtualHuman.backgroundStory,
        modelId: data.virtualHuman.modelId,
        voiceId: data.virtualHuman.voiceId,
        outfitId: data.virtualHuman.outfitId,
      });

      result.virtualHumanId = virtualHumanId;

      // 5. 导入消息（如果需要）
      if (importMessages && data.messages && data.messages.length > 0) {
        for (const msg of data.messages) {
          try {
            await MessageDAO.create({
              virtualHumanId,
              role: msg.role,
              content: msg.content,
              mode: msg.mode,
              emotion: msg.emotion,
              tokensUsed: msg.tokensUsed,
              responseTime: msg.responseTime,
            });
            result.statistics.messagesImported++;
          } catch (error) {
            console.error('Import message error:', error);
            result.errors.push(`消息导入失败: ${msg.content.substring(0, 20)}...`);
          }
        }
      }

      // 6. 导入记忆（如果需要）
      if (importMemories && data.memories && data.memories.length > 0) {
        for (const mem of data.memories) {
          try {
            await MemoryDAO.create({
              virtualHumanId: virtualHumanId,
              category: mem.category,
              key: (mem as any).key || (mem as any).content?.substring(0, 20) || 'imported_memory',
              value: (mem as any).value || (mem as any).content || '',
              importance: mem.importance,
            });
            result.statistics.memoriesImported++;
          } catch (error) {
            console.error('Import memory error:', error);
            result.errors.push(`记忆导入失败: ${mem.content.substring(0, 20)}...`);
          }
        }
      }

      result.success = true;
    } catch (error) {
      console.error('Import error:', error);
      result.errors.push('导入失败: ' + (error as Error).message);
    }

    return result;
  }

  /**
   * 批量导入多个虚拟人
   */
  async importMultiple(
    filePath: string,
    options: ImportOptions = {}
  ): Promise<ImportResult[]> {
    try {
      const fileContent = await RNFS.readFile(filePath, 'utf8');
      const data = JSON.parse(fileContent);

      if (!data.virtualHumans || !Array.isArray(data.virtualHumans)) {
        throw new Error('不是有效的批量导出文件');
      }

      const results: ImportResult[] = [];

      for (const vhData of data.virtualHumans) {
        // 为每个虚拟人创建临时文件
        const tempPath = `${RNFS.CachesDirectoryPath}/temp_import_${Date.now()}.json`;
        await RNFS.writeFile(tempPath, JSON.stringify(vhData), 'utf8');

        const result = await this.importFromFile(tempPath, options);
        results.push(result);

        // 清理临时文件
        await RNFS.unlink(tempPath).catch(() => {});
      }

      return results;
    } catch (error) {
      console.error('Import multiple error:', error);
      throw new Error('批量导入失败');
    }
  }

  /**
   * 从 JSON 字符串导入
   */
  async importFromJSON(
    jsonString: string,
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    const tempPath = `${RNFS.CachesDirectoryPath}/temp_import_${Date.now()}.json`;

    try {
      await RNFS.writeFile(tempPath, jsonString, 'utf8');
      const result = await this.importFromFile(tempPath, options);
      return result;
    } finally {
      // 清理临时文件
      await RNFS.unlink(tempPath).catch(() => {});
    }
  }

  /**
   * 验证导出数据格式
   */
  private validateExportData(data: any): data is ExportData {
    if (!data || typeof data !== 'object') {
      return false;
    }

    if (!data.version || !data.exportDate || !data.virtualHuman) {
      return false;
    }

    const vh = data.virtualHuman;
    if (!vh.name || !vh.gender || !vh.personality || !vh.backgroundStory) {
      return false;
    }

    return true;
  }

  /**
   * 预览导入数据
   * 不实际导入，只返回摘要信息
   */
  async previewImport(filePath: string): Promise<{
    name: string;
    age?: number;
    gender: string;
    occupation?: string;
    messageCount: number;
    memoryCount: number;
    exportDate: Date;
    version: string;
  } | null> {
    try {
      const fileContent = await RNFS.readFile(filePath, 'utf8');
      const data: ExportData = JSON.parse(fileContent);

      if (!this.validateExportData(data)) {
        return null;
      }

      return {
        name: data.virtualHuman.name,
        age: data.virtualHuman.age,
        gender: data.virtualHuman.gender,
        occupation: data.virtualHuman.occupation,
        messageCount: data.messages?.length || 0,
        memoryCount: data.memories?.length || 0,
        exportDate: new Date(data.exportDate),
        version: data.version,
      };
    } catch (error) {
      console.error('Preview error:', error);
      return null;
    }
  }

  /**
   * 检查导入兼容性
   */
  async checkCompatibility(filePath: string): Promise<{
    compatible: boolean;
    version: string;
    warnings: string[];
  }> {
    const result = {
      compatible: true,
      version: '',
      warnings: [] as string[],
    };

    try {
      const fileContent = await RNFS.readFile(filePath, 'utf8');
      const data: ExportData = JSON.parse(fileContent);

      result.version = data.version;

      // 检查版本兼容性
      const [majorVersion] = data.version.split('.');
      const [currentMajorVersion] = '1.0'.split('.');

      if (majorVersion !== currentMajorVersion) {
        result.compatible = false;
        result.warnings.push('版本不兼容，可能无法正确导入');
      }

      // 检查必需字段
      if (!data.virtualHuman.modelId) {
        result.warnings.push('缺少模型ID，将使用默认模型');
      }

      if (!data.virtualHuman.voiceId) {
        result.warnings.push('缺少音色ID，将使用默认音色');
      }

      // 检查数据大小
      if (data.messages && data.messages.length > 10000) {
        result.warnings.push(`消息数量较多(${data.messages.length})，导入可能需要较长时间`);
      }

      if (data.memories && data.memories.length > 1000) {
        result.warnings.push(`记忆数量较多(${data.memories.length})，导入可能需要较长时间`);
      }
    } catch (error) {
      result.compatible = false;
      result.warnings.push('文件格式错误或损坏');
    }

    return result;
  }

  /**
   * 合并导入
   * 将导入的数据与现有虚拟人合并，而不是替换
   */
  async mergeImport(
    filePath: string,
    targetVirtualHumanId: string
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      virtualHumanId: targetVirtualHumanId,
      statistics: {
        messagesImported: 0,
        memoriesImported: 0,
      },
      errors: [],
    };

    try {
      const fileContent = await RNFS.readFile(filePath, 'utf8');
      const data: ExportData = JSON.parse(fileContent);

      if (!this.validateExportData(data)) {
        result.errors.push('数据格式不正确');
        return result;
      }

      // 检查目标虚拟人是否存在
      const targetVH = await VirtualHumanDAO.getById(targetVirtualHumanId);
      if (!targetVH) {
        result.errors.push('目标虚拟人不存在');
        return result;
      }

      // 只导入消息和记忆，不修改虚拟人基本信息
      if (data.messages && data.messages.length > 0) {
        for (const msg of data.messages) {
          try {
            await MessageDAO.create({
              virtualHumanId: targetVirtualHumanId,
              role: msg.role,
              content: msg.content,
              mode: msg.mode,
              emotion: msg.emotion,
            });
            result.statistics.messagesImported++;
          } catch (error) {
            console.error('Merge message error:', error);
          }
        }
      }

      if (data.memories && data.memories.length > 0) {
        for (const mem of data.memories) {
          try {
            await MemoryDAO.create({
              virtualHumanId: targetVirtualHumanId,
              category: mem.category,
              key: (mem as any).key || (mem as any).content?.substring(0, 20) || 'imported_memory',
              value: (mem as any).value || (mem as any).content || '',
              importance: mem.importance,
            });
            result.statistics.memoriesImported++;
          } catch (error) {
            console.error('Merge memory error:', error);
          }
        }
      }

      result.success = true;
    } catch (error) {
      console.error('Merge import error:', error);
      result.errors.push('合并导入失败');
    }

    return result;
  }
}

export default new DataImportService();
