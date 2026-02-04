# 🃏 7 Card Stud 布局调整功能说明

## ✅ 已实现功能

现在在 7 Card Stud 和 Razz 模式下，你可以单独调整每个玩家的：
- **Hole Cards (底牌)** - 位置可调
- **Up Cards (明牌)** - 位置可调
- **统一缩放** - 所有明牌的大小统一调整

## 🎯 可调整的元素

### 每个座位包含两个独立元素：

1. **Hole Cards (底牌区域)**
   - ID: `player-1`, `player-3`, `player-4`, `player-5`, `player-6`, `player-8`
   - 包含玩家的底牌（2-3张）
   - 可以单独拖拽调整位置

2. **Up Cards (明牌区域)**
   - ID: `stud-1`, `stud-3`, `stud-4`, `stud-5`, `stud-6`, `stud-8`
   - 包含玩家的明牌（4张）
   - 可以单独拖拽调整位置
   - 相对于底牌的偏移位置

## 📐 配置结构

### 类型定义 (layoutConfig.ts)

```typescript
export interface StudCardsConfig {
  /** 相对 hole cards 的水平位置（像素） */
  left?: string
  /** 相对 hole cards 的垂直位置（像素） */
  top?: string
  right?: string
  bottom?: string
}

export interface StudLayout {
  /** 所有座位的明牌统一缩放比例 */
  uniformScale: number
  /** 每个座位的明牌位置（1, 3, 4, 5, 6, 8） */
  positions: Record<number, StudCardsConfig>
}
```

### 默认配置

```typescript
studCards: {
  uniformScale: 1.0,
  positions: {
    1: { left: '60px', top: '-60px' },
    3: { left: '60px', top: '-100px' },
    4: { left: '20px', top: '50px' },
    5: { left: '20px', top: '50px' },
    6: { left: '20px', top: '50px' },
    8: { left: '-85px', top: '-90px' },
  },
}
```

## 🎮 使用方法

### 1. 进入编辑模式
- 切换到 7 Card Stud 或 Razz 游戏模式
- 点击 ConfigBar 中的"布局调整"按钮

### 2. 调整底牌位置
- 点击选中某个玩家的底牌区域
- 拖拽到新位置
- 底牌区域会显示蓝色边框和角点

### 3. 调整明牌位置
- 点击选中某个玩家的明牌区域（4张牌叠加显示的区域）
- 拖拽到相对于底牌的新位置
- 明牌区域会显示蓝色边框和角点

### 4. 调整大小
- 使用 LayoutEditor 工具栏中的 +/- 按钮
- 调整"玩家手牌"缩放：影响所有底牌
- 调整明牌缩放：需要在 LayoutEditor 中添加对应控制（待实现）

### 5. 保存配置
- 点击"保存"按钮
- 配置保存到 Firebase
- 每个设备、每种游戏模式独立保存

## 📊 数据存储

### Firebase 结构

```
userBoardLayouts/{userId}/
  layouts/
    desktop/
      7stud/
        playerHands: { ... }  // 底牌配置
        studCards: {          // 明牌配置
          uniformScale: 1.0
          positions: {
            1: { left: '60px', top: '-60px' }
            3: { left: '60px', top: '-100px' }
            ...
          }
        }
```

### 座位说明

7 Card Stud 和 Razz 模式使用特定座位：
- **使用座位**: 1, 3, 4, 5, 6, 8
- **不使用**: 2, 7（这两个座位在 Stud 游戏中不参与）

## 🎨 边框配置

### 明牌边框 (selectionIndicatorConfig.ts)

```typescript
studCards: {
  offset: { top: -8, right: -8, bottom: -8, left: -8 },
  cornerSize: 10,
}
```

可以按设备类型调整：
- desktop
- mobileLandscape
- mobilePortrait

## 🔧 技术实现

### DraggableElement 包装

每个明牌容器都被 `DraggableElement` 包装：

```vue
<DraggableElement
  v-if="(gameMode === '7stud' || gameMode === 'razz') && playerStudCards[seat]"
  :is-editing="layoutEditState.isEditing"
  :is-selected="layoutEditState.selectedElement === `stud-${seat}`"
  :element-id="`stud-${seat}`"
  :initial-position="currentLayout.studCards?.positions[seat] || {}"
  :indicator-offset="studCardsIndicator.offset"
  :corner-size="studCardsIndicator.cornerSize"
  @select="layoutEditState.selectedElement = `stud-${seat}`"
  @position-change="(pos) => updateStudPosition(seat, pos)"
>
  <div class="stud-cards-container" :style="getStudCardContainerStyle(seat)">
    <!-- 明牌内容 -->
  </div>
</DraggableElement>
```

### 位置更新函数

```typescript
function updateStudPosition(seat: number, position: any) {
  if (!currentLayout.value.studCards) {
    currentLayout.value.studCards = JSON.parse(JSON.stringify(DEFAULT_LAYOUT_CONFIG.studCards))
  }
  currentLayout.value.studCards.positions[seat] = {
    ...currentLayout.value.studCards.positions[seat],
    ...position
  }
  layoutEditState.value.isDirty = true
}
```

## 📋 使用场景

### 场景 1: 调整明牌避免重叠
如果某个座位的明牌和底牌重叠：
1. 进入编辑模式
2. 点击该座位的明牌区域
3. 拖拽到不重叠的位置
4. 保存

### 场景 2: 适配不同屏幕
桌面端和移动端可能需要不同的明牌位置：
1. 在桌面端调整并保存
2. 切换到移动端
3. 单独调整移动端的明牌位置
4. 保存独立配置

### 场景 3: 不同游戏模式优化
7 Card Stud 和 Razz 可能需要不同的布局：
1. 在 7 Card Stud 模式调整布局
2. 切换到 Razz 模式
3. Razz 使用独立配置

## 🐛 已知限制

1. **明牌统一缩放**
   - 当前实现中，所有座位的明牌使用统一缩放
   - 不支持单独调整某个座位的明牌大小
   - 这是设计选择，保持一致性

2. **旋转角度固定**
   - 明牌的旋转角度由 `studCardsConfig` 中的 `rotation` 控制
   - 不在布局调整 UI 中暴露
   - 保持设计美感

3. **叠加偏移固定**
   - 明牌的叠加方式（offsetX, offsetY）固定
   - 不在布局调整 UI 中暴露
   - 避免过度复杂化

## 🔜 未来增强

### 可能添加的功能：

1. **明牌缩放控制**
   - 在 LayoutEditor 中添加"明牌大小"控制
   - 独立于底牌的缩放

2. **单座位独立缩放**
   - 允许每个座位的明牌有不同大小
   - 需要修改 StudLayout 结构

3. **可视化叠加调整**
   - 直接在 UI 中调整明牌的叠加方向和间距
   - 需要更复杂的编辑器

4. **旋转角度调整**
   - 允许用户调整明牌的旋转角度
   - 需要在 LayoutEditor 中添加旋转控制

## ✅ 测试步骤

### 基础测试
1. 切换到 7 Card Stud 模式
2. 进入布局调整模式
3. 点击座位 1 的底牌 → 显示边框
4. 点击座位 1 的明牌 → 显示边框（独立于底牌）
5. 拖拽明牌到新位置
6. 保存配置
7. 刷新页面 → 明牌位置保持

### 跨座位测试
1. 依次调整座位 1, 3, 4, 5, 6, 8 的明牌位置
2. 每个座位应该可以独立拖拽
3. 保存后所有位置应该保持

### 跨设备测试
1. 桌面端调整明牌位置并保存
2. 调整窗口到移动端尺寸
3. 移动端应该有独立配置
4. 可以单独调整移动端明牌位置

### 跨模式测试
1. 7 Card Stud 模式调整并保存
2. 切换到 Razz 模式
3. Razz 应该有独立配置
4. 调整 Razz 的明牌位置不影响 Stud

## 🎉 完成！

现在你可以：
- ✅ 单独调整每个玩家的底牌位置
- ✅ 单独调整每个玩家的明牌位置
- ✅ 为不同设备设置不同的明牌布局
- ✅ 为 7 Card Stud 和 Razz 分别配置
- ✅ 所有配置云端同步

享受完全自定义的 7 Card Stud 布局体验！🃏
