#!/bin/bash

# Firebase 布局配置部署脚本
# 使用方法: ./deploy-firestore.sh

echo "🚀 开始部署 Firestore Security Rules..."
echo ""

# 检查 Firebase CLI 是否安装
if ! command -v firebase &> /dev/null
then
    echo "❌ Firebase CLI 未安装"
    echo "请运行: npm install -g firebase-tools"
    exit 1
fi

echo "✅ Firebase CLI 已安装"
echo ""

# 检查是否已登录
echo "📝 检查登录状态..."
firebase projects:list > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ 未登录 Firebase"
    echo "请运行: firebase login"
    exit 1
fi

echo "✅ 已登录 Firebase"
echo ""

# 显示当前项目
echo "📋 当前 Firebase 项目:"
firebase use
echo ""

# 确认部署
read -p "确认部署 Firestore Rules 到此项目？(y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ 部署已取消"
    exit 1
fi

# 部署 Firestore Rules
echo ""
echo "📤 部署中..."
firebase deploy --only firestore:rules

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 部署成功！"
    echo ""
    echo "下一步:"
    echo "1. 访问 Firebase Console 验证规则"
    echo "2. 测试布局调整功能"
    echo "3. 查看部署文档: docs/FIREBASE_DEPLOYMENT.md"
else
    echo ""
    echo "❌ 部署失败"
    echo "请检查错误信息并重试"
    exit 1
fi
