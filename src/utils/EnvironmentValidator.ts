/**
 * 环境变量验证器
 * 确保所有必需的环境变量在应用启动时都已正确配置
 */

interface RequiredEnvVars {
  OPENAI_API_KEY: string;
  AZURE_SPEECH_KEY: string;
  AZURE_SPEECH_REGION: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class EnvironmentValidator {
  private static requiredVars: (keyof RequiredEnvVars)[] = [
    'OPENAI_API_KEY',
    'AZURE_SPEECH_KEY',
    'AZURE_SPEECH_REGION',
  ];

  /**
   * 验证环境变量
   */
  static validate(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    this.requiredVars.forEach((varName) => {
      const value = process.env[varName];

      // 检查是否存在
      if (!value || value.trim() === '') {
        errors.push(`${varName} is not configured`);
        return;
      }

      // 检查是否是占位符
      if (value.includes('your-') || value.includes('YOUR_')) {
        errors.push(`${varName} contains placeholder value: "${value}"`);
        return;
      }

      // 检查密钥长度（基本验证）
      if (varName.includes('KEY') && value.length < 10) {
        warnings.push(`${varName} seems too short (${value.length} chars), may be invalid`);
      }
    });

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

  /**
   * 获取验证状态报告
   */
  static getReport(): string {
    const { valid, errors, warnings } = this.validate();

    const lines: string[] = ['=== Environment Validation Report ===', ''];

    if (valid) {
      lines.push('✅ All required environment variables are configured');
    } else {
      lines.push('❌ Environment validation failed');
      lines.push('');
      lines.push('Errors:');
      errors.forEach((e) => lines.push(`  - ${e}`));
    }

    if (warnings.length > 0) {
      lines.push('');
      lines.push('Warnings:');
      warnings.forEach((w) => lines.push(`  - ${w}`));
    }

    return lines.join('\n');
  }
}

export default EnvironmentValidator;
