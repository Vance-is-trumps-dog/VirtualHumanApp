# Phase 6: 数据管理与分享总结

## 概述

Phase 6 实现了完整的数据管理功能，包括导出/导入、自动备份/恢复、数据统计分析等，让用户可以完全掌控自己的数据。

## 已完成功能

### 1. 数据导出服务 (DataExportService)

**文件**: `src/services/DataExportService.ts`

#### 核心功能

**1.1 单个虚拟人导出**
```typescript
async exportVirtualHuman(
  virtualHumanId: string,
  options?: {
    includeMessages?: boolean;
    includeMemories?: boolean;
    messageLimit?: number;
    format?: 'json' | 'txt';
  }
): Promise<string>
```

**导出内容**:
- 虚拟人基本信息（姓名、年龄、性格、背景故事等）
- 完整对话记录（可选，默认最多1000条）
- 所有记忆数据（可选）
- 统计信息（消息数、记忆数、对话天数）

**支持格式**:
- **JSON**: 结构化数据，便于导入和程序处理
- **TXT**: 人类可读的文本格式，适合阅读和归档

**1.2 批量导出**
```typescript
async exportAll(options: ExportOptions): Promise<string>
```

- 一次性导出所有虚拟人
- 生成单个JSON文件包含所有数据
- 适合完整备份场景

**1.3 文件分享**
```typescript
async shareExportedFile(filePath: string): Promise<void>
```

- 使用系统分享功能
- 支持分享到微信、QQ、邮件等
- 跨设备数据传输

**1.4 文件管理**
```typescript
async getExportedFiles(): Promise<Array<{
  name: string;
  path: string;
  size: number;
  modifiedTime: number;
}>>

async deleteExportFile(filePath: string): Promise<void>

async cleanupOldExports(daysToKeep: number): Promise<number>
```

- 列出所有导出文件
- 删除单个文件
- 自动清理旧文件（默认保留30天）

#### JSON 导出格式示例

```json
{
  "version": "1.0",
  "exportDate": 1738627200000,
  "virtualHuman": {
    "id": "vh_123",
    "name": "小艾",
    "age": 25,
    "gender": "female",
    "personality": { ... },
    "backgroundStory": "..."
  },
  "messages": [ ... ],
  "memories": [ ... ],
  "statistics": {
    "totalMessages": 1523,
    "totalMemories": 87,
    "conversationDays": 45
  }
}
```

#### TXT 导出格式示例

```
虚拟人数据导出
导出时间: 2025-02-04 10:30:00
版本: 1.0

=== 虚拟人信息 ===
姓名: 小艾
年龄: 25
性别: 女性
职业: 设计师
背景故事: ...

=== 统计信息 ===
总消息数: 1523
总记忆数: 87
对话天数: 45

=== 对话记录 ===

[2025-01-15 09:30:00] 用户:
你好，小艾

[2025-01-15 09:30:05] 小艾:
你好！很高兴见到你...
```

### 2. 数据导入服务 (DataImportService)

**文件**: `src/services/DataImportService.ts`

#### 核心功能

**2.1 从文件导入**
```typescript
async importFromFile(
  filePath: string,
  options?: {
    overwrite?: boolean;
    importMessages?: boolean;
    importMemories?: boolean;
  }
): Promise<ImportResult>
```

**导入流程**:
1. 读取并解析JSON文件
2. 验证数据格式和版本
3. 检查是否存在同名虚拟人
4. 导入基本信息
5. 导入消息（可选）
6. 导入记忆（可选）
7. 返回详细结果

**导入结果**:
```typescript
interface ImportResult {
  success: boolean;
  virtualHumanId?: string;
  statistics: {
    messagesImported: number;
    memoriesImported: number;
  };
  errors: string[];
}
```

**2.2 批量导入**
```typescript
async importMultiple(
  filePath: string,
  options: ImportOptions
): Promise<ImportResult[]>
```

- 从批量导出文件导入多个虚拟人
- 返回每个虚拟人的导入结果
- 支持部分成功场景

**2.3 导入预览**
```typescript
async previewImport(filePath: string): Promise<{
  name: string;
  age?: number;
  gender: string;
  messageCount: number;
  memoryCount: number;
  exportDate: Date;
  version: string;
} | null>
```

- 不实际导入，只显示摘要
- 让用户确认是否导入
- 查看数据规模

**2.4 兼容性检查**
```typescript
async checkCompatibility(filePath: string): Promise<{
  compatible: boolean;
  version: string;
  warnings: string[];
}>
```

**检查项**:
- 版本兼容性（主版本必须相同）
- 必需字段完整性
- 数据规模警告（消息/记忆过多）
- 缺失字段提醒

**2.5 合并导入**
```typescript
async mergeImport(
  filePath: string,
  targetVirtualHumanId: string
): Promise<ImportResult>
```

- 将导入数据合并到现有虚拟人
- 不替换基本信息
- 只添加消息和记忆
- 适合补充数据场景

### 3. 数据备份服务 (DataBackupService)

**文件**: `src/services/DataBackupService.ts`

#### 核心功能

**3.1 创建备份**
```typescript
async createBackup(auto: boolean = false): Promise<BackupMetadata>
```

**备份方式**:
- 直接复制 SQLite 数据库文件
- 快速高效
- 保留所有数据（虚拟人、消息、记忆）

**备份元数据**:
```typescript
interface BackupMetadata {
  id: string;
  timestamp: number;
  size: number;
  virtualHumanCount: number;
  messageCount: number;
  memoryCount: number;
  auto: boolean; // 是否自动备份
}
```

**3.2 恢复备份**
```typescript
async restoreBackup(backupId: string): Promise<void>
```

**安全恢复流程**:
1. 检查备份文件存在
2. 关闭当前数据库连接
3. 创建临时备份（以防恢复失败）
4. 复制备份文件到数据库路径
5. 重新打开数据库
6. 如果失败，还原临时备份
7. 删除临时文件

**3.3 自动备份**
```typescript
async autoBackup(): Promise<BackupMetadata | null>
```

**自动备份策略**:
- 检查最近24小时是否已备份
- 如果已有备份则跳过
- 自动清理旧备份（保留最近7个）
- 建议每天运行一次

**3.4 备份管理**
```typescript
async getBackups(): Promise<BackupMetadata[]>

async deleteBackup(backupId: string): Promise<void>

async getTotalBackupSize(): Promise<number>

async exportBackup(backupId: string, destPath: string): Promise<void>

async importBackup(sourcePath: string): Promise<BackupMetadata>
```

- 列出所有备份（按时间倒序）
- 验证备份文件存在性
- 删除指定备份
- 计算总备份大小
- 导出备份到外部存储
- 从外部存储导入备份

### 4. 数据统计服务 (DataStatisticsService)

**文件**: `src/services/DataStatisticsService.ts`

#### 核心功能

**4.1 应用级统计**
```typescript
async getAppStatistics(): Promise<AppStatistics>
```

**统计内容**:

**概览统计**:
- 总虚拟人数
- 总消息数
- 总记忆数
- 总对话次数
- 总Token使用量

**时间统计**:
- 首次互动时间
- 最近互动时间
- 活跃天数
- 平均每天消息数

**Top虚拟人**:
- 按消息数排序的前5个虚拟人
- 显示消息数和最近互动时间

**情感分布**:
- 7种情感的统计分布
- 了解用户整体情绪状态

**使用模式**:
- Text / Voice / Video 消息分布
- 了解用户偏好

**记忆类别**:
- 各类别记忆数量分布

**4.2 虚拟人详细统计**
```typescript
async getVirtualHumanStatistics(
  virtualHumanId: string
): Promise<VirtualHumanStatistics | null>
```

**统计维度**:

**基本信息**:
- ID、名称、创建时间
- 最近互动时间
- 总互动时长

**消息统计**:
- 总消息数、用户/AI消息数
- 平均消息长度、最长消息
- 按模式分布（Text/Voice/Video）
- 按情感分布

**记忆统计**:
- 总记忆数
- 按类别分布
- 按重要性分布
- 平均重要性

**互动统计**:
- 总天数、活跃天数
- 平均每天消息数
- 最长连续对话天数
- 当前连续天数

**性能统计**:
- 平均响应时间
- 总Token使用
- 平均每消息Token

**4.3 连续天数计算**
```typescript
private calculateStreaks(messages: any[]): {
  longest: number;
  current: number;
}
```

- 按日期分组消息
- 计算连续对话天数
- 识别最长连续记录
- 计算当前连续天数（今天或昨天有消息）

**4.4 使用报告**
```typescript
async generateUsageReport(
  startDate: Date,
  endDate: Date
): Promise<{
  period: { start: Date; end: Date };
  messages: number;
  memories: number;
  activeVirtualHumans: number;
  tokenUsage: number;
  topEmotions: Array<{ emotion: Emotion; count: number }>;
}>
```

- 指定时间段的使用报告
- 消息数、记忆数、活跃虚拟人
- Token使用统计
- Top 5 情感

**4.5 导出统计为CSV**
```typescript
async exportStatisticsToCSV(virtualHumanId?: string): Promise<string>
```

**CSV格式示例**:
```csv
指标,值
虚拟人名称,小艾
创建时间,2025-01-01 10:00:00
总消息数,1523
用户消息数,762
AI消息数,761
平均消息长度,45
总记忆数,87
活跃天数,45
最长连续天数,12
平均响应时间(ms),1234
总Token使用,123456
```

### 5. 数据管理界面 (DataManagementScreen)

**文件**: `src/screens/DataManagementScreen.tsx`

#### 界面模块

**5.1 数据统计卡片**
- 显示关键统计指标
- 支持全局统计和单个虚拟人统计
- 实时更新

**5.2 数据导出区域**
- **导出为JSON** 按钮
- **导出为文本** 按钮
- 最近导出文件列表（显示前3个）
- 文件名、大小、分享按钮

**5.3 数据导入区域**
- **从文件导入** 按钮
- 触发文件选择器（需要集成）
- 预览 → 确认 → 导入流程

**5.4 数据备份区域**
- **创建备份** 按钮
- 备份列表（所有备份）
  - 显示时间、大小、类型（手动/自动）
  - **恢复** 按钮
  - **删除** 按钮
- 确认对话框防止误操作

#### 交互流程

**导出流程**:
```
用户点击"导出为JSON"
  ↓
调用 DataExportService.exportVirtualHuman()
  ↓
显示成功对话框（文件路径）
  ↓
选项：确定 / 分享
  ↓
分享 → 调用系统分享功能
```

**导入流程**:
```
用户点击"从文件导入"
  ↓
打开文件选择器
  ↓
选择文件 → previewImport()
  ↓
显示预览信息
  ↓
用户确认 → importFromFile()
  ↓
显示导入结果
```

**备份恢复流程**:
```
用户点击"恢复"
  ↓
显示确认对话框（警告覆盖数据）
  ↓
用户确认 → restoreBackup()
  ↓
关闭数据库 → 创建临时备份 → 复制文件 → 重新打开
  ↓
显示成功 / 失败
```

## 技术亮点

### 1. 安全的备份恢复

**问题**: 恢复备份失败可能导致数据丢失

**解决方案**:
- 恢复前创建临时备份
- 失败时自动还原
- 确保数据安全

### 2. 数据格式版本控制

**问题**: 不同版本的数据格式可能不兼容

**解决方案**:
- 每个导出文件包含版本号
- 导入时检查版本兼容性
- 主版本不同则拒绝导入
- 提供警告信息

### 3. 自动备份策略

**问题**: 备份过多占用空间，备份过少容易丢失数据

**解决方案**:
- 24小时内不重复备份
- 自动保留最近7个备份
- 手动备份永久保留
- 可手动清理

### 4. 连续天数算法

**问题**: 准确计算用户的连续使用天数

**解决方案**:
- 按日期分组消息
- 检测连续日期序列
- 区分"最长连续"和"当前连续"
- 昨天有消息也算连续

### 5. 多格式导出

**问题**: 不同场景需要不同格式

**解决方案**:
- **JSON**: 结构化，易于导入和程序处理
- **TXT**: 可读性强，适合阅读和打印
- 支持自定义选择

## 数据流

### 完整导出导入流程

```
导出
  ↓
获取虚拟人数据 (VirtualHumanDAO)
  ↓
获取消息数据 (MessageDAO)
  ↓
获取记忆数据 (MemoryDAO)
  ↓
计算统计信息
  ↓
生成JSON/TXT文件
  ↓
保存到导出目录
  ↓
返回文件路径
```

```
导入
  ↓
读取文件内容
  ↓
解析JSON数据
  ↓
验证格式和版本
  ↓
检查兼容性
  ↓
检查是否存在同名虚拟人
  ↓
创建虚拟人 (VirtualHumanDAO)
  ↓
循环导入消息 (MessageDAO)
  ↓
循环导入记忆 (MemoryDAO)
  ↓
返回导入结果
```

### 备份恢复流程

```
备份
  ↓
关闭数据库连接（如需要）
  ↓
复制数据库文件到备份目录
  ↓
获取统计信息
  ↓
保存备份元数据
  ↓
清理旧备份（自动备份）
  ↓
返回备份信息
```

```
恢复
  ↓
检查备份文件存在
  ↓
关闭当前数据库
  ↓
创建临时备份
  ↓
复制备份文件到数据库路径
  ↓
重新打开数据库
  ↓
成功 → 删除临时备份
失败 → 还原临时备份
  ↓
返回结果
```

## 使用示例

### 示例 1：导出虚拟人

```typescript
// 导出为JSON（包含所有数据）
const filePath = await DataExportService.exportVirtualHuman('vh_123', {
  includeMessages: true,
  includeMemories: true,
  messageLimit: 1000,
  format: 'json',
});

console.log('导出成功:', filePath);
// 输出: /path/to/exports/小艾_1738627200000.json

// 分享文件
await DataExportService.shareExportedFile(filePath);
```

### 示例 2：导入虚拟人

```typescript
// 预览导入
const preview = await DataImportService.previewImport('/path/to/file.json');
console.log(`将导入: ${preview.name}, ${preview.messageCount}条消息`);

// 检查兼容性
const compatibility = await DataImportService.checkCompatibility('/path/to/file.json');
if (!compatibility.compatible) {
  console.error('版本不兼容:', compatibility.warnings);
  return;
}

// 执行导入
const result = await DataImportService.importFromFile('/path/to/file.json', {
  overwrite: false,
  importMessages: true,
  importMemories: true,
});

if (result.success) {
  console.log(`导入成功: ${result.statistics.messagesImported}条消息, ${result.statistics.memoriesImported}条记忆`);
} else {
  console.error('导入失败:', result.errors);
}
```

### 示例 3：自动备份

```typescript
// 设置每天自动备份（在App启动时调用）
const backup = await DataBackupService.autoBackup();

if (backup) {
  console.log(`自动备份已创建: ${backup.id}, 大小: ${backup.size / 1024 / 1024} MB`);
} else {
  console.log('跳过备份: 最近已有备份');
}
```

### 示例 4：获取统计数据

```typescript
// 应用级统计
const appStats = await DataStatisticsService.getAppStatistics();
console.log(`总虚拟人: ${appStats.overview.totalVirtualHumans}`);
console.log(`总消息: ${appStats.overview.totalMessages}`);
console.log(`活跃天数: ${appStats.timeStats.activeDays}`);

// 单个虚拟人统计
const vhStats = await DataStatisticsService.getVirtualHumanStatistics('vh_123');
console.log(`消息总数: ${vhStats.messages.total}`);
console.log(`最长连续: ${vhStats.engagement.longestStreak}天`);
console.log(`当前连续: ${vhStats.engagement.currentStreak}天`);

// 生成CSV报告
const csv = await DataStatisticsService.exportStatisticsToCSV('vh_123');
console.log(csv);
```

### 示例 5：恢复备份

```typescript
// 获取所有备份
const backups = await DataBackupService.getBackups();
console.log(`共有 ${backups.length} 个备份`);

// 恢复最新备份
const latestBackup = backups[0];
await DataBackupService.restoreBackup(latestBackup.id);
console.log('数据已恢复');
```

## 性能优化

### 1. 增量导出

**问题**: 导出所有消息可能很慢

**优化**:
- 提供 `messageLimit` 参数
- 默认最多1000条
- 减少文件大小和处理时间

### 2. 异步处理

**问题**: 导入大量数据阻塞UI

**优化**:
- 所有IO操作异步执行
- 显示加载指示器
- 提供进度反馈

### 3. 数据库直接复制

**问题**: 逐条导出/导入效率低

**优化**:
- 备份直接复制数据库文件
- 速度快10-100倍
- 适合完整备份场景

### 4. 文件清理

**问题**: 导出文件累积占用空间

**优化**:
- 自动清理30天前的文件
- 手动清理功能
- 显示文件大小

## 数据安全

### 1. 导出前验证

- 检查虚拟人存在性
- 验证数据完整性
- 捕获异常

### 2. 导入前验证

- 格式验证
- 版本检查
- 兼容性检查
- 预览功能

### 3. 备份安全

- 恢复前创建临时备份
- 失败自动回滚
- 元数据持久化

### 4. 隐私保护

- 数据仅存储在本地
- 不上传到服务器
- 用户完全控制

## 未来扩展

### 1. 云端同步

- 集成iCloud / Google Drive
- 自动同步备份
- 跨设备数据同步

### 2. 增量备份

- 只备份变更部分
- 减少备份大小
- 加快备份速度

### 3. 加密导出

- 密码保护导出文件
- AES-256加密
- 保护隐私

### 4. 选择性导出

- 按时间范围导出
- 按标签过滤
- 自定义字段

### 5. 数据压缩

- ZIP压缩导出文件
- 减少文件大小
- 便于传输

## 总结

Phase 6 成功实现了完整的数据管理系统：

✅ **数据导出**: JSON/TXT双格式，支持单个和批量导出
✅ **数据导入**: 智能导入，预览、兼容性检查、合并模式
✅ **数据备份**: 安全备份恢复，自动备份策略，导出导入备份
✅ **数据统计**: 应用级和虚拟人级详细统计，CSV导出
✅ **管理界面**: 一站式数据管理，导出/导入/备份/统计

**核心价值**:
- 数据完全掌控在用户手中
- 防止数据丢失
- 跨设备数据迁移
- 深入了解使用情况
- 数据可读性和可移植性

**项目总体进度**: **7/8 阶段完成（87.5%）**

- ✅ Phase 0: 项目准备
- ✅ Phase 1: MVP核心功能
- ✅ Phase 2: 语音功能
- ✅ Phase 3: 3D渲染系统
- ✅ Phase 4: 高级创建功能
- ✅ Phase 5: 智能功能增强
- ✅ **Phase 6: 数据管理与分享** ← 刚刚完成
- ⏳ Phase 7: 优化与发布
