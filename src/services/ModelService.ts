/**
 * 3D模型管理服务
 */

import { Model3D, Outfit, Asset } from '@types';
import Database from '@database';

export class ModelService {
  /**
   * 获取所有3D模型
   */
  async getAllModels(): Promise<Model3D[]> {
    const rows = await Database.executeSql(
      "SELECT * FROM assets WHERE type = 'model' ORDER BY is_builtin DESC, name ASC"
    );

    return rows.map(row => this.mapRowToModel(row));
  }

  /**
   * 根据ID获取模型
   */
  async getModelById(id: string): Promise<Model3D | null> {
    const rows = await Database.executeSql(
      "SELECT * FROM assets WHERE id = ? AND type = 'model'",
      [id]
    );

    if (rows.length === 0) return null;
    return this.mapRowToModel(rows[0]);
  }

  /**
   * 获取所有服装
   */
  async getAllOutfits(): Promise<Outfit[]> {
    const rows = await Database.executeSql(
      "SELECT * FROM assets WHERE type = 'outfit' ORDER BY is_builtin DESC, name ASC"
    );

    return rows.map(row => this.mapRowToOutfit(row));
  }

  /**
   * 根据ID获取服装
   */
  async getOutfitById(id: string): Promise<Outfit | null> {
    const rows = await Database.executeSql(
      "SELECT * FROM assets WHERE id = ? AND type = 'outfit'",
      [id]
    );

    if (rows.length === 0) return null;
    return this.mapRowToOutfit(rows[0]);
  }

  /**
   * 获取所有背景
   */
  async getAllBackgrounds(): Promise<Asset[]> {
    const rows = await Database.executeSql(
      "SELECT * FROM assets WHERE type = 'background' ORDER BY is_builtin DESC, name ASC"
    );

    return rows.map(row => this.mapRowToAsset(row));
  }

  /**
   * 预加载模型资源
   */
  async preloadModel(modelId: string): Promise<void> {
    const model = await this.getModelById(modelId);
    if (!model) {
      throw new Error('Model not found');
    }

    // 如果是远程资源且未下载，先下载
    if (!model.isDownloaded && model.downloadUrl) {
      await this.downloadModel(model);
    }
  }

  /**
   * 下载模型
   */
  private async downloadModel(model: Model3D): Promise<void> {
    // 实现模型下载逻辑
    console.log('Downloading model:', model.id);

    // 下载完成后更新数据库
    await Database.executeSql(
      "UPDATE assets SET is_downloaded = 1 WHERE id = ?",
      [model.id]
    );
  }

  /**
   * 获取模型元数据
   */
  getModelMetadata(model: Model3D): {
    hasBlendShapes: boolean;
    polygonCount: number;
    textureSize: string;
  } {
    const metadata = model.metadata || {};
    return {
      hasBlendShapes: metadata.hasBlendShapes || false,
      polygonCount: metadata.polygonCount || 0,
      textureSize: metadata.textureSize || 'unknown',
    };
  }

  /**
   * 验证模型兼容性
   */
  validateModel(model: Model3D): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!model.modelUrl) {
      errors.push('模型文件路径缺失');
    }

    if (!model.hasBlendShapes) {
      errors.push('模型缺少BlendShapes，无法支持表情动画');
    }

    if (model.polygonCount && model.polygonCount > 50000) {
      errors.push('模型多边形数量过多，可能影响性能');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 映射数据库行到模型对象
   */
  private mapRowToModel(row: any): Model3D {
    const metadata = row.metadata ? JSON.parse(row.metadata) : {};

    return {
      id: row.id,
      name: row.name,
      gender: metadata.gender || 'other',
      style: metadata.style || 'realistic',
      thumbnailUrl: row.thumbnail_url,
      modelUrl: row.url,
      polygonCount: metadata.polygonCount,
      hasBlendShapes: metadata.hasBlendShapes || false,
    };
  }

  /**
   * 映射数据库行到服装对象
   */
  private mapRowToOutfit(row: any): Outfit {
    const metadata = row.metadata ? JSON.parse(row.metadata) : {};

    return {
      id: row.id,
      name: row.name,
      category: metadata.category || 'casual',
      season: metadata.season || 'all',
      thumbnailUrl: row.thumbnail_url,
      colors: metadata.colors || [],
    };
  }

  /**
   * 映射数据库行到资源对象
   */
  private mapRowToAsset(row: any): Asset {
    return {
      id: row.id,
      type: row.type,
      name: row.name,
      description: row.description,
      url: row.url,
      thumbnailUrl: row.thumbnail_url,
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
      isBuiltin: row.is_builtin === 1,
      isDownloaded: row.is_downloaded === 1,
      createdAt: row.created_at,
      fileSize: row.file_size,
      downloadUrl: row.download_url,
    };
  }
}

export default new ModelService();
