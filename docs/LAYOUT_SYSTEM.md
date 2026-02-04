# 🎨 布局调整系统设计文档

## 📋 功能概述

允许用户自定义调整牌桌布局，包括：
- 公共牌位置和大小
- 牌堆位置和大小
- 8个玩家手牌位置（统一缩放）
- 针对不同设备（桌面、移动横屏、移动竖屏）和游戏模式独立配置
- 配置保存到 Firebase，跨设备同步

## 🗂️ 文件结构

```
src/
├── types/
│   └── layoutConfig.ts           # 类型定义
├── services/
│   └── layoutConfigService.ts    # Firebase 数据服务
└── pages/BoardAnalysis/
    └── components/
        ├── LayoutEditor.vue      # 布局编辑器工具栏
        └── DraggableElement.vue  # 可拖拽元素包装组件
```

## 📊 数据结构

### Firebase 集合结构

```
userBoardLayouts (collection)
└── {userId} (document)
    ├── userId: string
    ├── updatedAt: number (timestamp)
    └── layouts: {
          desktop?: {
            holdem?: BoardLayoutConfig
            omaha?: BoardLayoutConfig
            ...
          },
          mobileLandscape?: {
            holdem?: BoardLayoutConfig
            ...
          },
          mobilePortrait?: {
            ...
          }
        }
```

### BoardLayoutConfig 结构

```typescript
{
  communityCards: {
    transform: {
      top: '42%',
      left: '50%',
      scale: 1.0
    },
    spacing: 88  // 公共牌间距
  },
  deck: {
    transform: {
      bottom: '50%',
      left: '50%',
      scale: 0.85
    }
  },
  playerHands: {
    uniformScale: 1.0,  // 所有手牌统一缩放
    positions: {
      1: { bottom: '15%', left: '22%' },
      2: { bottom: '35%', left: '10%' },
      // ... 8个座位
    }
  }
}
```

## 🎯 核心功能

### 1. 编辑模式

用户点击"布局调整"按钮进入编辑模式：

- ✅ 顶部显示工具栏（LayoutEditor 组件）
- ✅ 所有可调整元素显示虚线边框
- ✅ 点击元素选中（蓝色实线边框 + 四角圆点）
- ✅ 拖拽元素调整位置
- ✅ 使用 +/- 按钮调整大小

### 2. 调整限制

- **公共牌**：可调位置、大小、间距
- **牌堆**：可调位置、大小
- **玩家手牌**：
  - 可单独调整每个座位的位置
  - 统一缩放（所有手牌同步缩放）
  - 旋转角度固定（不可调整）

### 3. 保存机制

```
点击"保存" → 调用 saveLayoutConfig()
              → 保存到 Firebase
              → 按 userId + deviceType + gameMode 存储
```

### 4. 加载机制

```
页面加载 → 检测设备类型 (desktop/mobileLandscape/mobilePortrait)
         → 获取当前游戏模式
         → 调用 getLayoutForDeviceAndMode()
         → 如果有自定义配置则使用，否则使用默认配置
         → 应用到界面
```

## 🔧 集成到 BoardAnalysis/Index.vue

### 步骤1: 引入组件和服务

```typescript
import LayoutEditor from './components/LayoutEditor.vue'
import DraggableElement from './components/DraggableElement.vue'
import { getLayoutForDeviceAndMode, saveLayoutConfig } from '@/services/layoutConfigService'
import type { BoardLayoutConfig, LayoutEditState } from '@/types/layoutConfig'
import { DEFAULT_LAYOUT_CONFIG } from '@/types/layoutConfig'
```

### 步骤2: 添加状态

```typescript
// 布局配置
const currentLayout = ref<BoardLayoutConfig>(DEFAULT_LAYOUT_CONFIG)

// 编辑状态
const layoutEditState = ref<LayoutEditState>({
  isEditing: false,
  selectedElement: null,
  showGrid: false,
  isDirty: false,
})
```

### 步骤3: 加载配置

```typescript
onMounted(async () => {
  if (userStore.profile?.uid) {
    const layout = await getLayoutForDeviceAndMode(
      userStore.profile.uid,
      deviceType.value,
      gameMode.value
    )
    currentLayout.value = layout
  }
})
```

### 步骤4: 包装可调整元素

```vue
<!-- 公共牌 -->
<DraggableElement
  :is-editing="layoutEditState.isEditing"
  :is-selected="layoutEditState.selectedElement === 'communityCards'"
  element-id="communityCards"
  :initial-position="currentLayout.communityCards.transform"
  @select="layoutEditState.selectedElement = 'communityCards'"
  @position-change="updateCommunityCardsPosition"
>
  <div class="community-cards-group" :style="communityCardsStyle">
    <!-- 原有公共牌内容 -->
  </div>
</DraggableElement>

<!-- 牌堆 -->
<DraggableElement
  :is-editing="layoutEditState.isEditing"
  :is-selected="layoutEditState.selectedElement === 'deck'"
  element-id="deck"
  :initial-position="currentLayout.deck.transform"
  @select="layoutEditState.selectedElement = 'deck'"
  @position-change="updateDeckPosition"
>
  <div class="deck" :style="deckStyle">
    <CardStackNew :count="15" :offsetX="1" :offsetY="2.5" />
  </div>
</DraggableElement>

<!-- 玩家手牌（循环8个座位） -->
<DraggableElement
  v-for="seat in activeSeats"
  :key="seat"
  :is-editing="layoutEditState.isEditing"
  :is-selected="layoutEditState.selectedElement === `player-${seat}`"
  :element-id="`player-${seat}`"
  :initial-position="currentLayout.playerHands.positions[seat]"
  @select="layoutEditState.selectedElement = `player-${seat}`"
  @position-change="(pos) => updatePlayerPosition(seat, pos)"
>
  <div class="player-area" :style="getPlayerStyle(seat)">
    <!-- 原有手牌内容 -->
  </div>
</DraggableElement>
```

### 步骤5: 添加工具栏和按钮

```vue
<!-- 布局调整按钮 -->
<button class="layout-adjust-btn" @click="toggleLayoutEdit">
  {{ layoutEditState.isEditing ? '退出调整' : '布局调整' }}
</button>

<!-- 编辑器工具栏 -->
<LayoutEditor
  v-model:layout-config="currentLayout"
  v-model:edit-state="layoutEditState"
  @save="handleSaveLayout"
  @reset="handleResetLayout"
  @cancel="handleCancelEdit"
/>
```

### 步骤6: 实现处理函数

```typescript
async function handleSaveLayout() {
  if (!userStore.profile?.uid) return

  const success = await saveLayoutConfig(
    userStore.profile.uid,
    deviceType.value,
    gameMode.value,
    currentLayout.value
  )

  if (success) {
    ElMessage.success('布局已保存')
    layoutEditState.value.isDirty = false
  } else {
    ElMessage.error('保存失败')
  }
}

function handleResetLayout() {
  currentLayout.value = { ...DEFAULT_LAYOUT_CONFIG }
  layoutEditState.value.isDirty = true
}

function handleCancelEdit() {
  layoutEditState.value.isEditing = false
  // 重新加载配置
  loadLayout()
}
```

## 📱 移动端适配

### 按钮位置

- **桌面端**：右上角工具栏区域
- **移动端横屏**：右下角浮动按钮
- **移动端竖屏**：底部固定按钮

### 工具栏布局

```css
@media (max-width: 1024px) {
  .layout-editor {
    /* 全屏覆盖 */
    top: 0;
    left: 0;
    right: 0;
    transform: none;
    border-radius: 0;
    width: 100vw;
  }

  .editor-toolbar {
    flex-direction: column;
  }
}
```

## 🎮 使用流程

### 用户角度

1. **进入调整模式**
   - 点击"布局调整"按钮
   - 顶部出现工具栏

2. **调整元素**
   - 点击选中元素（显示蓝色边框）
   - 拖拽移动位置
   - 使用 +/- 按钮调整大小

3. **保存配置**
   - 点击"保存"按钮
   - 配置保存到云端
   - 下次打开自动应用

4. **重置/取消**
   - "重置"：恢复默认配置
   - "取消"：放弃更改，退出编辑模式

### 开发角度

1. **添加新的可调整元素**
   ```vue
   <DraggableElement
     :is-editing="layoutEditState.isEditing"
     :is-selected="isSelected"
     element-id="newElement"
     :initial-position="position"
     @select="handleSelect"
     @position-change="handlePositionChange"
   >
     <!-- 元素内容 -->
   </DraggableElement>
   ```

2. **扩展配置结构**
   - 在 `layoutConfig.ts` 中添加新字段
   - 更新 `DEFAULT_LAYOUT_CONFIG`
   - 在 `LayoutEditor.vue` 中添加控制项

## 🔐 权限和安全

- ✅ 只有登录用户可以保存配置
- ✅ 每个用户只能访问自己的配置
- ✅ Firebase Security Rules 限制访问

### Firebase Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /userBoardLayouts/{userId} {
      // 只允许用户访问自己的配置
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 📈 未来扩展

- [ ] 预设模板（紧凑、宽松、经典）
- [ ] 一键复制配置到其他设备/模式
- [ ] 导入/导出配置（JSON 文件）
- [ ] 社区分享配置
- [ ] 撤销/重做功能
- [ ] 实时预览不同游戏模式
