# 📱 VirtualHumanApp 部署指南

本指南将帮助你在 Android 和 iPad 上测试应用，使用 GitHub Actions 进行云端构建。

## 🚀 快速开始

### 前置要求

- GitHub 账号
- Git 已安装
- Node.js 18+ 已安装

---

## 📦 第一步：生成 iOS 项目文件（仅首次需要）

由于项目目前只有 Android 配置，需要先生成 iOS 项目文件才能在 iPad 上运行。

### 方法 1: 使用模板生成（推荐）

```bash
# 1. 创建临时项目
cd C:\Users\administer\Desktop
npx react-native@0.73.0 init TempApp

# 2. 复制 iOS 文件夹到你的项目
xcopy TempApp\ios VirtualHumanApp\ios /E /I /H

# 3. 删除临时项目
rmdir /s /q TempApp

# 4. 修改 iOS 项目配置
cd VirtualHumanApp\ios
```

### 方法 2: 手动创建（如果方法1不可用）

如果你有 macOS 设备，可以在 Mac 上运行：

```bash
cd /path/to/VirtualHumanApp
npx pod-install
```

---

## 🔧 第二步：配置 GitHub 仓库

### 1. 初始化 Git 仓库（如果还没有推送到 GitHub）

```bash
cd C:\Users\administer\Desktop\VirtualHumanApp

# 添加所有文件
git add .

# 创建首次提交
git commit -m "Initial commit with CI/CD setup"

# 创建 GitHub 仓库（在 GitHub 网站上创建，然后运行）
git remote add origin https://github.com/YOUR_USERNAME/VirtualHumanApp.git
git branch -M main
git push -u origin main
```

### 2. 启用 GitHub Actions

- 访问你的 GitHub 仓库
- 进入 **Settings** → **Actions** → **General**
- 确保 **Allow all actions and reusable workflows** 已启用

---

## 🏗️ 第三步：云端构建

### 自动构建（推荐）

每次推送代码到 `main` 或 `master` 分支时，GitHub Actions 会自动构建：

```bash
git add .
git commit -m "Update app"
git push
```

### 手动触发构建

1. 访问你的 GitHub 仓库
2. 点击 **Actions** 标签
3. 选择工作流：
   - `Build All Platforms` - 同时构建 Android 和 iOS
   - `Android Build` - 仅构建 Android
   - `iOS Build` - 仅构建 iOS
4. 点击 **Run workflow** → **Run workflow**

---

## 📥 第四步：下载和安装

### 下载构建的应用

1. 在 GitHub 仓库中，点击 **Actions** 标签
2. 选择最近的成功构建（绿色 ✓）
3. 滚动到底部的 **Artifacts** 部分
4. 下载：
   - **VirtualHumanApp-Android** - Android APK
   - **VirtualHumanApp-iOS** - iOS IPA

### 在 Android 手机上安装

#### 方法 1: 直接安装（推荐）

1. 下载 `VirtualHumanApp-Android.zip`
2. 解压得到 `app-release.apk`
3. 将 APK 传输到手机（通过 USB、邮件、云盘等）
4. 在手机上打开 APK 文件
5. 允许"未知来源"安装（在设置中）
6. 完成安装

#### 方法 2: 使用 ADB

```bash
# 连接手机到电脑并启用 USB 调试
adb install app-release.apk
```

### 在 iPad 上安装

#### 方法 1: 使用 AltStore（无需开发者账号）

1. 在 iPad 上安装 [AltStore](https://altstore.io/)
2. 下载 `VirtualHumanApp-iOS.zip` 并解压得到 `.ipa`
3. 通过 AltStore 安装 IPA 文件

#### 方法 2: 使用 Apple Developer 账号

如果你有开发者账号：

```bash
# 安装 ios-deploy
npm install -g ios-deploy

# 连接 iPad 并安装
ios-deploy --bundle VirtualHumanApp.ipa
```

#### 方法 3: 使用 TestFlight（推荐用于团队测试）

需要付费的 Apple Developer 账号（$99/年）：

1. 在 App Store Connect 创建应用
2. 上传 IPA 到 TestFlight
3. 邀请测试人员
4. 测试人员通过 TestFlight 应用安装

---

## 🔄 工作流说明

### Android Build (`android-build.yml`)

- 触发时机：推送到 main/master、PR、手动触发
- 构建内容：Release APK 和 Debug APK
- 输出文件：
  - `app-release.apk` - 用于分发
  - `app-debug.apk` - 用于调试

### iOS Build (`ios-build.yml`)

- 触发时机：推送到 main/master、PR、手动触发
- 构建内容：未签名的 IPA
- 输出文件：`VirtualHumanApp.ipa`
- ⚠️ 注意：需要先创建 `ios` 文件夹

### Build All Platforms (`build-all.yml`)

- 触发时机：推送到 main/master、版本标签、手动触发
- 构建内容：同时构建 Android 和 iOS
- 适用场景：发布新版本时使用

---

## 🔐 签名配置（可选 - 用于发布）

### Android 应用签名

如果要发布到 Google Play，需要配置发布签名：

#### 1. 生成发布密钥

```bash
cd android\app
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

#### 2. 将密钥添加到 GitHub Secrets

1. 将 `release.keystore` 转换为 base64：
   ```bash
   certutil -encode release.keystore release.keystore.b64
   ```

2. 在 GitHub 仓库中：
   - Settings → Secrets and variables → Actions
   - 添加以下 secrets：
     - `ANDROID_KEYSTORE_BASE64` - keystore 的 base64 内容
     - `ANDROID_KEYSTORE_PASSWORD` - keystore 密码
     - `ANDROID_KEY_ALIAS` - 密钥别名
     - `ANDROID_KEY_PASSWORD` - 密钥密码

#### 3. 更新 GitHub Actions 工作流

在 `.github/workflows/android-build.yml` 中添加签名步骤（已包含在配置中）。

### iOS 应用签名

iOS 应用签名需要 Apple Developer 账号和证书：

1. 在 Apple Developer 网站创建证书和配置文件
2. 将证书和配置文件添加到 GitHub Secrets
3. 更新工作流以使用签名配置

详细步骤请参考：https://docs.github.com/en/actions/deployment/deploying-xcode-applications/installing-an-apple-certificate-on-macos-runners-for-xcode-development

---

## 📊 构建状态徽章

在你的 README.md 中添加构建状态徽章：

```markdown
![Android Build](https://github.com/YOUR_USERNAME/VirtualHumanApp/workflows/Android%20Build/badge.svg)
![iOS Build](https://github.com/YOUR_USERNAME/VirtualHumanApp/workflows/iOS%20Build/badge.svg)
```

---

## 🐛 常见问题

### Q: Android 构建失败，提示找不到 SDK

**A:** 检查 `android/local.properties` 是否在 `.gitignore` 中。GitHub Actions 会自动配置 SDK。

### Q: iOS 构建失败，提示找不到 workspace

**A:** 确保 `ios` 文件夹已创建并运行过 `pod install`。

### Q: 如何在真机上测试？

**A:**
- **Android**: 下载 APK 直接安装即可
- **iOS**: 使用 AltStore（免费）或 TestFlight（需要开发者账号）

### Q: 能否自动发布到应用商店？

**A:** 可以！需要额外配置：
- **Google Play**: 使用 Fastlane + Play Store API
- **App Store**: 使用 Fastlane + App Store Connect API

### Q: GitHub Actions 免费吗？

**A:** 公开仓库完全免费。私有仓库每月有 2000 分钟的免费额度。

---

## 📞 获取帮助

- GitHub Actions 文档: https://docs.github.com/en/actions
- React Native 文档: https://reactnative.dev/
- 问题反馈: 在项目中创建 Issue

---

## ✅ 检查清单

使用此检查清单确保一切就绪：

- [ ] 已创建 `ios` 文件夹（用于 iPad 测试）
- [ ] 已初始化 Git 仓库
- [ ] 已推送代码到 GitHub
- [ ] 已启用 GitHub Actions
- [ ] 已成功运行至少一次构建
- [ ] 已下载构建产物（APK/IPA）
- [ ] 已在设备上成功安装应用

完成以上步骤后，你就可以在 Android 手机和 iPad 上测试应用了！🎉
