# 🎴 卡牌缩放配置说明

## 📍 配置文件位置

`src/config/cardScaleConfig.ts`

## 🎯 快速调整

想要调整所有设备上的卡牌大小？只需修改配置文件中的 `DEFAULT_CARD_SCALE` 对象：

```typescript
export const DEFAULT_CARD_SCALE: CardScaleConfig = {
  desktop: 1.0,           // 👈 调整这里：桌面端卡牌大小
  mobileLandscape: 0.8,   // 👈 调整这里：手机横屏卡牌大小
  mobilePortrait: 0.65,   // 👈 调整这里：手机竖屏卡牌大小
}
```

## 📊 推荐值范围

| 设备类型 | 推荐范围 | 默认值 | 说明 |
|---------|---------|--------|------|
| **桌面端** | 0.8 - 1.2 | 1.0 | 标准显示器，大屏幕 |
| **移动端横屏** | 0.65 - 0.9 | 0.8 | iPhone/Android 横屏模式 |
| **移动端竖屏** | 0.5 - 0.75 | 0.65 | iPhone/Android 竖屏模式 |

## 🔧 其他可调整参数

### 1. 牌堆额外缩放

```typescript
export const DECK_EXTRA_SCALE = 0.85  // 👈 调整牌堆相对卡牌的缩放
```

- 牌堆最终大小 = `currentCardScale × DECK_EXTRA_SCALE`
- 推荐范围: 0.7 - 1.0

### 2. 公共牌基础间距

```typescript
export const BASE_CARD_SPACING = 88  // 👈 调整公共牌之间的间距（像素）
```

- 实际间距 = `BASE_CARD_SPACING × currentCardScale`
- 推荐范围: 70 - 100
- **自动响应**：间距会随卡牌缩放系数自动调整
  - 桌面端 (1.1): 88 × 1.1 = 96.8px
  - 移动端横屏 (0.8): 88 × 0.8 = 70.4px
  - 移动端竖屏 (0.65): 88 × 0.65 = 57.2px

### 3. 公共牌位置配置

```typescript
export const DEFAULT_COMMUNITY_POSITION: Record<
  keyof CardScaleConfig,
  CommunityCardsPositionConfig
> = {
  desktop: {
    top: '42%',    // 👈 调整垂直位置
    left: '50%',   // 👈 调整水平位置
    width: 440,    // 👈 容器宽度
  },
  mobileLandscape: {
    top: '40%',    // 👈 横屏位置
    left: '48%',
    width: 440,
  },
  mobilePortrait: {
    top: '38%',    // 👈 竖屏位置
    left: '50%',
    width: 440,
  },
}
```

- **top**: 垂直位置百分比 (推荐范围: 35% - 50%)
- **left**: 水平位置百分比 (推荐范围: 45% - 55%)
- **width**: 容器宽度，建议 = `BASE_CARD_SPACING × 5`
- **不同设备独立配置**：可以为桌面端、移动端横屏、移动端竖屏分别设置

## 📱 设备检测规则

系统会自动检测设备类型：

```
屏幕宽度 > 1024px  →  桌面端 (desktop)
屏幕宽度 ≤ 1024px  →  移动端
  └─ 横屏 (width > height)  →  mobileLandscape
  └─ 竖屏 (width ≤ height)  →  mobilePortrait
```

## 🎨 影响范围

调整 `DEFAULT_CARD_SCALE` 会影响：

✅ **公共牌大小** (Flop, Turn, River)
✅ **公共牌间距** (自动按比例调整)
✅ **玩家手牌** (Hole Cards)
✅ **7 Card Stud 明牌**
✅ **牌堆** (Deck)

调整 `DEFAULT_COMMUNITY_POSITION` 会影响：

✅ **公共牌位置** (垂直、水平位置)
✅ **不同设备独立控制** (桌面、横屏、竖屏)

❌ **不影响**：
- 牌桌背景大小
- 玩家位置布局
- Mini Chips 标记

## 💡 调整建议

### 场景1: 觉得牌太小
```typescript
desktop: 1.1,           // +10% 大小
mobileLandscape: 0.85,  // +5% 大小
mobilePortrait: 0.7,    // +5% 大小
```

### 场景2: 觉得牌太大（遮挡背景）
```typescript
desktop: 0.9,           // -10% 大小
mobileLandscape: 0.75,  // -5% 大小
mobilePortrait: 0.6,    // -5% 大小
```

### 场景3: 只调整移动端
```typescript
desktop: 1.0,           // 保持不变
mobileLandscape: 0.7,   // 改小
mobilePortrait: 0.55,   // 改小
```

### 场景4: 调整公共牌间距
```typescript
// 如果觉得公共牌太挤
export const BASE_CARD_SPACING = 100  // 增加间距

// 如果觉得公共牌太松散
export const BASE_CARD_SPACING = 75   // 减小间距
```

### 场景5: 调整公共牌位置（移动端横屏）
```typescript
export const DEFAULT_COMMUNITY_POSITION = {
  desktop: {
    top: '42%',
    left: '50%',
    width: 440,
  },
  mobileLandscape: {
    top: '35%',    // 👈 往上移 5%
    left: '45%',   // 👈 往左移 3%
    width: 440,
  },
  mobilePortrait: {
    top: '38%',
    left: '50%',
    width: 440,
  },
}
```

## 🔄 生效方式

修改配置后：
1. **开发环境**: 自动热重载，无需刷新
2. **生产环境**: 需要重新构建项目

## 🐛 调试技巧

打开浏览器控制台，输入：

```javascript
// 查看当前缩放系数
console.log('Card Scale:', document.querySelector('.player-hand').style.transform)

// 查看当前设备类型
console.log('Device Type:', window.innerWidth, 'x', window.innerHeight)
```

## ⚙️ 高级用法

如果需要针对特定游戏模式调整，可以在 `BoardAnalysis/Index.vue` 中覆盖：

```typescript
const CARD_SCALE_FACTOR = ref({
  ...DEFAULT_CARD_SCALE,
  // 特定模式调整
  ...(gameMode.value === '7stud' ? {
    desktop: 0.9,  // 7 Card Stud 牌多，缩小一点
  } : {})
})
```

## 📝 版本历史

- v1.0: 初始版本，统一卡牌缩放系数
