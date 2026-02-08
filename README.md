# VirtualHumanApp - 虚拟人互动应用

一个功能丰富的虚拟人互动移动应用，支持文字、语音、视频多模态对话，基于React Native + Unity 3D + AI技术栈。

## 📱 功能特性

- ✅ **虚拟人创建**: 快速模板创建 / 完全自定义
- ✅ **多模态对话**: 文字聊天 / 语音通话 / 视频聊天
- ✅ **智能记忆**: 长期记忆系统，记住用户信息
- ✅ **情绪系统**: 根据对话内容动态调整虚拟人情绪
- ✅ **3D渲染**: 完整3D虚拟人，口型同步，表情动画
- ✅ **个性化**: 5维度性格设定，背景故事自定义
- ✅ **数据管理**: 聊天记录导出，虚拟人分享

## 🚀 快速开始

### 环境要求

- Node.js 18+
- React Native 0.73+
- Android Studio（Android开发）
- Xcode（iOS开发，需macOS）
- Unity 2022.3 LTS（3D功能）

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd VirtualHumanApp
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，填入你的API密钥
```

4. **iOS依赖（仅macOS）**
```bash
cd ios
pod install
cd ..
```

5. **运行应用**
```bash
# Android
npm run android

# iOS
npm run ios
```

## 📖 文档

详细文档请查看 `/docs` 目录：

- [开发环境搭建指南](docs/开发环境搭建指南.md)
- [技术架构文档](docs/技术架构文档.md)
- [数据库设计](docs/数据库设计.md)
- [API接口文档](docs/API接口文档.md)

## 🛠 技术栈

### 前端
- **React Native** - 跨平台移动开发框架
- **TypeScript** - 类型安全
- **React Navigation** - 导航
- **Zustand** - 状态管理
- **React Native Paper** - UI组件

### 后端服务
- **OpenAI GPT-4** - AI对话引擎
- **Azure Speech Services** - 语音识别与合成
- **Unity** - 3D渲染引擎

### 数据存储
- **SQLite** - 本地数据库
- **AsyncStorage** - 键值存储

## 📁 项目结构

```
VirtualHumanApp/
├── docs/                    # 文档
├── src/
│   ├── components/          # 可复用组件
│   ├── screens/             # 页面组件
│   ├── navigation/          # 导航配置
│   ├── services/            # 服务层（AI、语音等）
│   ├── database/            # 数据库操作
│   ├── store/               # 状态管理
│   ├── utils/               # 工具函数
│   ├── types/               # TypeScript类型
│   ├── constants/           # 常量配置
│   └── assets/              # 静态资源
├── android/                 # Android原生代码
├── ios/                     # iOS原生代码
└── unity/                   # Unity 3D项目（待添加）
```

## 🔑 API密钥申请

### OpenAI API
1. 访问：https://platform.openai.com/
2. 注册并获取API Key
3. 设置使用限额

### Azure Speech Services
1. 访问：https://portal.azure.com/
2. 创建语音服务资源
3. 获取密钥和区域

详细步骤参见[开发环境搭建指南](docs/开发环境搭建指南.md)。

## 📊 开发进度

- ✅ Phase 0: 项目准备（已完成）
- ⏳ Phase 1: MVP核心功能（进行中）
- ⬜ Phase 2: 语音功能
- ⬜ Phase 3: 3D渲染
- ⬜ Phase 4: 高级创建
- ⬜ Phase 5: 智能增强
- ⬜ Phase 6: 数据管理
- ⬜ Phase 7: 完善发布

## 🤝 贡献指南

1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📝 许可证

[MIT License](LICENSE)

## 📧 联系方式

项目问题请提交 [Issue](issues)

---

**当前版本**: v0.1.0-alpha
**最后更新**: 2026-02-04
