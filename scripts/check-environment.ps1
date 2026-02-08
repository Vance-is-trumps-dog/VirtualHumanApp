# 移动设备测试环境检查脚本

# 检查Node.js版本
Write-Host "=== 检查开发环境 ===" -ForegroundColor Cyan
Write-Host ""

# 检查Node.js
Write-Host "1. 检查 Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node -v
    Write-Host "   ✅ Node.js 版本: $nodeVersion" -ForegroundColor Green

    if ($nodeVersion -match "v(\d+)\.") {
        $majorVersion = [int]$matches[1]
        if ($majorVersion -lt 18) {
            Write-Host "   ⚠️  警告: 建议使用 Node.js 18+ 版本" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "   ❌ Node.js 未安装" -ForegroundColor Red
    Write-Host "   请访问 https://nodejs.org 下载安装" -ForegroundColor Red
}

Write-Host ""

# 检查npm
Write-Host "2. 检查 npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm -v
    Write-Host "   ✅ npm 版本: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ npm 未安装" -ForegroundColor Red
}

Write-Host ""

# 检查Git
Write-Host "3. 检查 Git..." -ForegroundColor Yellow
try {
    $gitVersion = git --version
    Write-Host "   ✅ $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Git 未安装（可选）" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== 环境检查完成 ===" -ForegroundColor Cyan
