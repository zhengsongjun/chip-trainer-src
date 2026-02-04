@echo off
REM Firebase 布局配置部署脚本 (Windows)
REM 使用方法: deploy-firestore.bat

echo 🚀 开始部署 Firestore Security Rules...
echo.

REM 检查 Firebase CLI 是否安装
where firebase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Firebase CLI 未安装
    echo 请运行: npm install -g firebase-tools
    pause
    exit /b 1
)

echo ✅ Firebase CLI 已安装
echo.

REM 检查是否已登录
echo 📝 检查登录状态...
firebase projects:list >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 未登录 Firebase
    echo 请运行: firebase login
    pause
    exit /b 1
)

echo ✅ 已登录 Firebase
echo.

REM 显示当前项目
echo 📋 当前 Firebase 项目:
firebase use
echo.

REM 确认部署
set /p confirm="确认部署 Firestore Rules 到此项目？(y/n): "
if /i not "%confirm%"=="y" (
    echo ❌ 部署已取消
    pause
    exit /b 1
)

REM 部署 Firestore Rules
echo.
echo 📤 部署中...
firebase deploy --only firestore:rules

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ 部署成功！
    echo.
    echo 下一步:
    echo 1. 访问 Firebase Console 验证规则
    echo 2. 测试布局调整功能
    echo 3. 查看部署文档: docs\FIREBASE_DEPLOYMENT.md
) else (
    echo.
    echo ❌ 部署失败
    echo 请检查错误信息并重试
    pause
    exit /b 1
)

echo.
pause
