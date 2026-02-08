/**
 * 照片转3D服务
 * 集成AI生成3D模型的API
 */

import axios from 'axios';
import RNFS from 'react-native-fs';
import { AppError, ErrorCode } from '@types';

export class PhotoTo3DService {
  private apiKey: string;
  private baseURL = 'https://api.avaturn.me/v1'; // 示例：Avaturn API

  constructor() {
    // 验证API密钥（可选服务，如果配置了才验证）
    const apiKey = process.env.PHOTO_TO_3D_API_KEY || '';

    if (apiKey && (apiKey.includes('your-') || apiKey.includes('YOUR_'))) {
      console.warn('Photo-to-3D API key contains placeholder value. Service may not work.');
    }

    this.apiKey = apiKey;
  }

  /**
   * 检查服务是否已配置
   */
  private ensureConfigured(): void {
    if (!this.apiKey || this.apiKey.trim() === '') {
      throw new AppError(
        ErrorCode.CONFIGURATION_ERROR,
        'Photo-to-3D service is not configured. Please set PHOTO_TO_3D_API_KEY in .env file.'
      );
    }
  }

  /**
   * 上传照片并生成3D模型
   */
  async generateModel(photoUri: string, options?: {
    style?: 'realistic' | 'cartoon';
    gender?: 'male' | 'female' | 'auto';
  }): Promise<{
    avatarId: string;
    status: 'processing' | 'completed';
    estimatedTime?: number;
    modelUrl?: string;
    thumbnailUrl?: string;
  }> {
    this.ensureConfigured();

    try {
      // 读取照片文件
      const photoData = await RNFS.readFile(photoUri, 'base64');

      // 创建FormData
      const formData = new FormData();
      formData.append('photo', {
        uri: photoUri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      } as never); // 使用 never 而不是 any
      formData.append('style', options?.style || 'realistic');
      formData.append('gender', options?.gender || 'auto');

      // 调用API
      const response = await axios.post(
        `${this.baseURL}/avatars`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000, // 60秒
        }
      );

      return {
        avatarId: response.data.avatar_id,
        status: response.data.status,
        estimatedTime: response.data.estimated_time,
      };
    } catch (error) {
      console.error('Photo to 3D error:', error);
      throw new AppError(ErrorCode.MODEL_NOT_FOUND, '照片转3D失败');
    }
  }

  /**
   * 查询生成状态
   */
  async checkStatus(avatarId: string): Promise<{
    status: 'processing' | 'completed' | 'failed';
    progress?: number;
    modelUrl?: string;
    thumbnailUrl?: string;
    error?: string;
  }> {
    try {
      const response = await axios.get(
        `${this.baseURL}/avatars/${avatarId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      return {
        status: response.data.status,
        progress: response.data.progress,
        modelUrl: response.data.model_url,
        thumbnailUrl: response.data.thumbnail_url,
        error: response.data.error,
      };
    } catch (error) {
      console.error('Check status error:', error);
      throw new AppError(ErrorCode.MODEL_NOT_FOUND, '查询状态失败');
    }
  }

  /**
   * 下载3D模型到本地
   */
  async downloadModel(modelUrl: string, modelId: string): Promise<string> {
    try {
      const localPath = `${RNFS.DocumentDirectoryPath}/models/${modelId}.glb`;

      // 确保目录存在
      await RNFS.mkdir(`${RNFS.DocumentDirectoryPath}/models`).catch(() => {});

      // 下载文件
      const downloadResult = await RNFS.downloadFile({
        fromUrl: modelUrl,
        toFile: localPath,
      }).promise;

      if (downloadResult.statusCode === 200) {
        return localPath;
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Download model error:', error);
      throw new AppError(ErrorCode.ASSET_DOWNLOAD_FAILED, '下载模型失败');
    }
  }

  /**
   * 使用Ready Player Me生成（免费方案）
   */
  async generateWithReadyPlayerMe(photoUri: string): Promise<string> {
    // Ready Player Me的iframe集成方式
    // 返回配置URL，让用户在WebView中完成创建
    const baseUrl = 'https://demo.readyplayer.me/avatar';
    const params = new URLSearchParams({
      frameApi: 'true',
      clearCache: 'true',
    });

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * 保存模型到数据库
   */
  async saveModelToDatabase(modelData: {
    id: string;
    name: string;
    gender: 'male' | 'female' | 'other';
    modelUrl: string;
    thumbnailUrl: string;
  }): Promise<void> {
    // 这里集成到ModelService或直接操作数据库
    const Database = (await import('@database')).default;

    const metadata = {
      gender: modelData.gender,
      style: 'realistic',
      polygonCount: 0, // 未知
      hasBlendShapes: true, // 假设有
    };

    await Database.executeSql(
      `INSERT INTO assets (id, type, name, url, thumbnail_url, metadata, is_builtin, is_downloaded, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        modelData.id,
        'model',
        modelData.name,
        modelData.modelUrl,
        modelData.thumbnailUrl,
        JSON.stringify(metadata),
        0,
        1,
        Date.now(),
      ]
    );
  }
}

export default new PhotoTo3DService();
