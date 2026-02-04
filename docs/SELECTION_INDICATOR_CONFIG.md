# 🎯 选中边框配置说明

## 📝 修复内容

### 问题 1: 牌堆边框离图形太远 ✅
**解决方案**: 为每种元素类型添加可配置的边框偏移

### 问题 2: 手牌边框参数可配置 ✅
**解决方案**: 创建配置文件，按设备类型区分

### 问题 3: 退出编辑模式时保留边框 ✅
**解决方案**: 修改 CSS，只在编辑模式显示边框

---

## 📁 新增文件

### `src/config/selectionIndicatorConfig.ts`

这是边框配置的中心文件，包含：

```typescript
export interface SelectionIndicatorConfig {
  /** 边框距离元素的偏移（像素） */
  offset: {
    top: number
    right: number
    bottom: number
    left: number
  }
  /** 角点大小（像素） */
  cornerSize: number
}
```

---

## 🎨 配置参数说明

### 1. 桌面端 (desktop)

#### 公共牌
```typescript
communityCards: {
  offset: { top: -8, right: -8, bottom: -8, left: -8 },
  cornerSize: 12,
}
```

#### 牌堆
```typescript
deck: {
  offset: { top: -15, right: -15, bottom: -15, left: -15 },
  cornerSize: 12,
}
```

#### 玩家手牌
```typescript
playerHand: {
  offset: { top: -6, right: -6, bottom: -6, left: -6 },
  cornerSize: 10,
}
```

### 2. 移动端横屏 (mobileLandscape)

- 边框偏移稍小（-6, -12, -5）
- 角点大小稍小（10, 10, 8）

### 3. 移动端竖屏 (mobilePortrait)

- 边框偏移更小（-5, -10, -4）
- 角点大小更小（8, 8, 8）

---

## 🔧 如何调整边框位置

### 调整牌堆边框

打开 `src/config/selectionIndicatorConfig.ts`，找到：

```typescript
desktop: {
  deck: {
    offset: {
      top: -15,    // 上边框距离
      right: -15,  // 右边框距离
      bottom: -15, // 下边框距离
      left: -15    // 左边框距离
    },
    cornerSize: 12, // 角点大小
  },
}
```

**调整步骤**:

1. **让边框更贴近牌堆**: 减小负数的绝对值
   ```typescript
   offset: { top: -10, right: -10, bottom: -10, left: -10 }
   ```

2. **让边框更远离牌堆**: 增大负数的绝对值
   ```typescript
   offset: { top: -20, right: -20, bottom: -20, left: -20 }
   ```

3. **单独调整某一边**: 只修改对应的值
   ```typescript
   offset: { top: -10, right: -15, bottom: -15, left: -15 }
   // 上边框更靠近，其他边保持原样
   ```

4. **调整角点大小**:
   ```typescript
   cornerSize: 14  // 更大的角点
   cornerSize: 8   // 更小的角点
   ```

### 调整手牌边框

同样在 `selectionIndicatorConfig.ts` 中：

```typescript
playerHand: {
  offset: { top: -6, right: -6, bottom: -6, left: -6 },
  cornerSize: 10,
}
```

**示例调整**:

```typescript
// 更贴近手牌
playerHand: {
  offset: { top: -4, right: -4, bottom: -4, left: -4 },
  cornerSize: 8,
}

// 更宽松的边框
playerHand: {
  offset: { top: -10, right: -10, bottom: -10, left: -10 },
  cornerSize: 12,
}
```

---

## 📱 不同设备独立配置

边框配置会根据设备类型自动切换：

- **桌面端**: 使用 `desktop` 配置
- **移动端横屏**: 使用 `mobileLandscape` 配置
- **移动端竖屏**: 使用 `mobilePortrait` 配置

这样可以确保在不同屏幕尺寸下，边框都能完美覆盖图形元素。

---

## 🎯 边框显示逻辑

### 编辑模式
- ✅ 鼠标悬停：显示虚线边框（蓝色半透明）
- ✅ 选中状态：显示实线边框 + 4个角点（蓝色）
- ✅ 拖拽中：边框保持，透明度降低

### 非编辑模式
- ❌ 不显示任何边框
- ❌ 不显示角点
- ✅ 布局正常展示

---

## 🧪 测试步骤

### 1. 测试牌堆边框调整

1. 修改 `selectionIndicatorConfig.ts` 中 `deck` 的 `offset`
2. 刷新页面
3. 点击"布局调整"
4. 点击牌堆元素
5. 查看蓝色边框是否贴合牌堆图形

### 2. 测试手牌边框调整

1. 修改 `selectionIndicatorConfig.ts` 中 `playerHand` 的 `offset`
2. 刷新页面
3. 进入编辑模式
4. 点击任意手牌
5. 查看边框是否完美覆盖手牌区域

### 3. 测试退出编辑模式

1. 进入编辑模式
2. 选中任意元素（显示边框）
3. 点击"退出调整"
4. **验证**: 所有边框和角点应该消失 ✅

### 4. 测试跨设备配置

1. 在桌面端调整边框位置
2. 调整浏览器窗口到移动端尺寸
3. 移动端应该使用独立的边框配置

---

## 💡 推荐配置值

### 牌堆边框（根据实际图形大小调整）

如果牌堆的视觉边界在缩放后约为 100x150px：

```typescript
deck: {
  offset: {
    top: -10,    // 距离顶部 10px
    right: -10,  // 距离右侧 10px
    bottom: -10, // 距离底部 10px
    left: -10    // 距离左侧 10px
  },
  cornerSize: 10,
}
```

### 手牌边框（根据手牌数量和间距调整）

如果单张牌宽度 70px，2张牌间距 18px，总宽度约 160px：

```typescript
playerHand: {
  offset: {
    top: -5,
    right: -5,
    bottom: -5,
    left: -5
  },
  cornerSize: 8,
}
```

---

## 🔍 调试技巧

### 查看元素实际尺寸

1. 打开浏览器开发者工具（F12）
2. 进入编辑模式
3. 选中元素
4. 在 Elements 面板查看 `.selection-indicator` 的计算样式
5. 根据实际渲染尺寸调整 offset 值

### 实时调整

使用浏览器开发者工具实时调整：

1. 选中 `.selection-indicator` 元素
2. 在 Styles 面板修改 `top`, `right`, `bottom`, `left` 值
3. 找到合适的值后，更新到配置文件

---

## ✅ 完成的改进

1. ✅ **可配置的边框偏移** - 每种元素独立配置
2. ✅ **可配置的角点大小** - 适应不同设备
3. ✅ **设备类型区分** - 桌面端、移动横屏、移动竖屏独立配置
4. ✅ **退出编辑时隐藏边框** - 只在编辑模式显示
5. ✅ **动态应用配置** - 自动根据设备类型选择配置

---

## 🎉 现在可以做的事情

1. **调整牌堆边框**: 修改 `deck.offset` 让边框贴合牌堆
2. **调整手牌边框**: 修改 `playerHand.offset` 让边框覆盖手牌
3. **跨设备优化**: 分别优化桌面端和移动端的边框显示
4. **自定义角点**: 调整 `cornerSize` 改变角点大小

---

## 📞 如需进一步调整

如果当前配置仍不理想，请告诉我：

1. 哪个元素的边框需要调整（公共牌/牌堆/手牌）
2. 边框应该更靠近还是更远离元素
3. 在哪个设备上（桌面/移动横屏/移动竖屏）

我会帮你计算合适的 offset 值！
