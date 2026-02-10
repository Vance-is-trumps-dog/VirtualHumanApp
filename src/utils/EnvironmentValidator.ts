/**
 * 环境变量验证器
 * 确保所有必需的环境变量在应用启动时都已正确配置
 */

// @ts-ignore
import { OPENAI_API_KEY, AZURE_SPEECH_KEY, AZURE_SPEECH_REGION } from '@env';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class EnvironmentValidator {
  /**
   * 验证环境变量
   */
  static validate(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 显式构建配置对象，避免动态读取 process.env 导致 react-native-dotenv 失效
    const config = {
      OPENAI_API_KEY,
      AZURE_SPEECH_KEY,
      AZURE_SPEECH_REGION
    };

    // 验证 OpenAI Key
    if (!config.OPENAI_API_KEY || config.OPENAI_API_KEY.trim() === '') {
      errors.push('OPENAI_API_KEY is not configured');
    } else if (config.OPENAI_API_KEY.includes('placeholder')) {
      // 允许 placeholder 用于测试启动，但给予警告
      warnings.push('OPENAI_API_KEY is using a placeholder value');
    }

    // 验证 Azure Speech Key
    if (!config.AZURE_SPEECH_KEY || config.AZURE_SPEECH_KEY.trim() === '') {
      errors.push('AZURE_SPEECH_KEY is not configured');
    } else if (config.AZURE_SPEECH_KEY.includes('placeholder')) {
      warnings.push('AZURE_SPEECH_KEY is using a placeholder value');
    }

    // 验证 Azure Region
    if (!config.AZURE_SPEECH_REGION || config.AZURE_SPEECH_REGION.trim() === '') {
      errors.push('AZURE_SPEECH_REGION is not configured');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 验证或抛出异常
   */
  static validateOrThrow(): void {
    const { valid, errors, warnings } = this.validate();

    if (!valid) {
      const errorMessage = [
        '❌ Environment validation failed:',
        '',
        'Missing or invalid environment variables:',
        ...errors.map((e) => `  - ${e}`),
        '',
        'Please check your .env file and ensure all required API keys are configured.',
        'See .env.example for reference.',
      ].join('\n');

      throw new Error(errorMessage);
    }

    // 输出警告
    if (warnings.length > 0) {
      console.warn('⚠️  Environment warnings:');
      warnings.forEach((w) => console.warn(`  - ${w}`));
    }
  }
}

export default EnvironmentValidator;
