# Firebase 布局配置部署指南

## 📋 概述

本文档说明如何将布局调整功能部署到 Firebase，包括 Firestore Security Rules 的配置。

## ✅ 前置条件

1. 已有 Firebase 项目：`reg-training-tool`
2. Firebase CLI 已安装
3. 本地已登录 Firebase 账户

## 🚀 部署步骤

### 1. 检查 Firebase 配置

确认 `src/firebase/index.ts` 中的配置正确：

```typescript
const firebaseConfig = {
  apiKey: 'AIzaSyApKIQ66DzjYrs3DxknQLoHJ5r0YnWU7xg',
  authDomain: 'reg-training-tool.firebaseapp.com',
  projectId: 'reg-training-tool',
  // ...
}
```

### 2. 部署 Firestore Security Rules

#### 方法 1: 使用 Firebase CLI（推荐）

```bash
# 确保在项目根目录
cd E:\ChipTrainer\chip-trainer

# 部署 Firestore Rules
firebase deploy --only firestore:rules
```

#### 方法 2: 通过 Firebase Console

1. 打开 [Firebase Console](https://console.firebase.google.com/)
2. 选择项目 `reg-training-tool`
3. 进入 **Firestore Database** → **规则**
4. 将 `firestore.rules` 的内容复制粘贴到编辑器
5. 点击**发布**

### 3. 验证 Security Rules

部署后，检查以下规则是否生效：

```javascript
// 用户布局配置
match /userBoardLayouts/{userId} {
  // 只允许认证用户访问自己的配置
  allow read: if request.auth != null && request.auth.uid == userId;
  allow create, update: if request.auth != null
                       && request.auth.uid == userId
                       && request.resource.data.userId == userId;
  allow delete: if request.auth != null && request.auth.uid == userId;
}
```

### 4. 创建 Firestore 索引（如需要）

如果查询性能有问题，可能需要创建索引：

1. 打开 Firebase Console → Firestore Database → **索引**
2. 通常单字段查询不需要索引
3. 如果控制台提示需要索引，点击链接自动创建

## 🧪 测试部署

### 测试 1: 未登录用户

```javascript
// 预期行为
- 使用默认布局配置
- 无法保存配置
- 显示 "请先登录" 提示
```

### 测试 2: 已登录用户

```javascript
// 预期行为
1. 进入编辑模式
2. 调整公共牌/牌堆/手牌位置和大小
3. 点击保存
4. 刷新页面，配置应该保持
```

### 测试 3: 跨设备同步

```javascript
// 预期行为
1. 在桌面端调整布局并保存
2. 切换到移动端
3. 桌面端配置不影响移动端（独立配置）
```

### 测试 4: 切换游戏模式

```javascript
// 预期行为
1. Omaha 模式调整布局并保存
2. 切换到 Hold'em 模式
3. Hold'em 使用独立配置（不受 Omaha 影响）
```

## 📊 数据结构

### Firestore Collection: `userBoardLayouts`

```
Collection: userBoardLayouts
Document ID: {userId}
{
  userId: "user123",
  updatedAt: 1234567890,
  layouts: {
    desktop: {
      holdem: { communityCards: {...}, deck: {...}, playerHands: {...} },
      omaha: { communityCards: {...}, deck: {...}, playerHands: {...} },
      bigo: { ... },
      // ... 其他 9 种游戏模式
    },
    mobileLandscape: {
      holdem: { ... },
      omaha: { ... },
      // ... 12 种游戏模式
    },
    mobilePortrait: {
      holdem: { ... },
      omaha: { ... },
      // ... 12 种游戏模式
    }
  }
}
```

### 单个布局配置结构

```typescript
{
  communityCards: {
    transform: {
      top: "42%",
      left: "50%",
      scale: 1.0
    },
    spacing: 88
  },
  deck: {
    transform: {
      bottom: "50%",
      left: "50%",
      scale: 0.85
    }
  },
  playerHands: {
    uniformScale: 1.0,
    positions: {
      1: { left: "...", top: "..." },
      2: { left: "...", top: "..." },
      // ... 座位 3-8
    }
  }
}
```

## 🔒 安全性说明

### Security Rules 保护

1. **读取权限**
   - 只有认证用户才能读取
   - 只能读取自己的配置（`userId` 匹配）

2. **写入权限**
   - 只有认证用户才能写入
   - 只能写入自己的配置
   - 写入的数据必须包含正确的 `userId`

3. **删除权限**
   - 只有认证用户才能删除
   - 只能删除自己的配置

### 防止常见攻击

```javascript
// ❌ 恶意用户尝试修改他人配置
await setDoc(doc(db, 'userBoardLayouts', 'victim-user-id'), {...})
// 结果: 被 Security Rules 拒绝

// ❌ 未登录用户尝试保存配置
await setDoc(doc(db, 'userBoardLayouts', 'any-user-id'), {...})
// 结果: 被 Security Rules 拒绝

// ✅ 正确的用法
const currentUser = auth.currentUser
await setDoc(doc(db, 'userBoardLayouts', currentUser.uid), {
  userId: currentUser.uid,
  layouts: {...}
})
// 结果: 成功
```

## 🐛 常见问题

### 问题 1: "Missing or insufficient permissions"

**原因**: Security Rules 未部署或配置错误

**解决**:
```bash
firebase deploy --only firestore:rules
```

### 问题 2: 保存后刷新页面配置丢失

**原因**:
- 用户未登录
- `userStore.profile.uid` 为空

**解决**: 确保用户已登录并且 `userStore` 正确存储用户信息

### 问题 3: 切换设备后配置混乱

**原因**: `deviceType` 检测不准确

**解决**: 检查 `src/config/cardScaleConfig.ts` 中的 `getDeviceType()` 函数

### 问题 4: Firebase 请求过多（成本问题）

**优化建议**:
1. 使用本地缓存（已实现）
2. 只在用户点击保存时写入
3. 考虑使用 `updateDoc` 代替 `setDoc`（减少数据传输）

## 📈 监控和维护

### 1. 查看使用情况

Firebase Console → Firestore Database → **使用情况**
- 读取次数
- 写入次数
- 删除次数
- 存储大小

### 2. 设置预算警报

Firebase Console → 项目设置 → **预算和提醒**
- 设置每日/每月预算
- 达到阈值时发送邮件提醒

### 3. 优化建议

如果使用量过大：

1. **启用离线持久化**
   ```typescript
   import { enableIndexedDbPersistence } from 'firebase/firestore'
   enableIndexedDbPersistence(db)
   ```

2. **批量写入**
   ```typescript
   // 使用已实现的 batchSaveLayoutConfigs
   await batchSaveLayoutConfigs(userId, [
     { deviceType: 'desktop', gameMode: 'holdem', layoutConfig: {...} },
     { deviceType: 'desktop', gameMode: 'omaha', layoutConfig: {...} }
   ])
   ```

3. **减少实时监听**
   - 当前实现使用 `getDoc`（按需读取）✅
   - 避免使用 `onSnapshot`（实时监听，费用高）

## ✅ 部署检查清单

- [ ] Firebase 配置正确 (`src/firebase/index.ts`)
- [ ] Security Rules 已部署 (`firestore.rules`)
- [ ] 测试未登录用户行为
- [ ] 测试已登录用户保存/加载
- [ ] 测试跨设备配置隔离
- [ ] 测试跨游戏模式配置隔离
- [ ] 检查 Firebase 使用量
- [ ] 设置预算警报

## 🎉 完成！

部署完成后，用户可以：
1. 自定义每种设备和游戏模式的布局
2. 配置自动云端同步
3. 跨设备保持独立配置
4. 安全地存储和读取个人配置

如有问题，请检查：
- Firebase Console → Firestore Database → **数据**
- Firebase Console → Firestore Database → **规则**
- 浏览器控制台的错误信息
