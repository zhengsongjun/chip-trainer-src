# 🚀 布局调整系统 - 快速开始

## ✅ 已完成的工作

### 1. 核心文件

- ✅ `src/types/layoutConfig.ts` - 类型定义
- ✅ `src/services/layoutConfigService.ts` - Firebase 数据服务
- ✅ `src/pages/BoardAnalysis/components/LayoutEditor.vue` - 编辑器工具栏
- ✅ `src/pages/BoardAnalysis/components/DraggableElement.vue` - 可拖拽组件
- ✅ `docs/LAYOUT_SYSTEM.md` - 完整设计文档
- ✅ `firestore.rules.example` - Firebase 安全规则示例

### 2. 数据结构设计

```typescript
// Firebase 集合：userBoardLayouts
{
  userId: string
  updatedAt: number
  layouts: {
    desktop?: {
      holdem?: BoardLayoutConfig
      omaha?: BoardLayoutConfig
      ...
    },
    mobileLandscape?: { ... },
    mobilePortrait?: { ... }
  }
}
```

## 📋 下一步：集成到 BoardAnalysis

### 步骤 1: 导入依赖

在 `src/pages/BoardAnalysis/Index.vue` 的 `<script setup>` 中添加：

```typescript
import LayoutEditor from './components/LayoutEditor.vue'
import DraggableElement from './components/DraggableElement.vue'
import { getLayoutForDeviceAndMode, saveLayoutConfig, resetLayoutConfig } from '@/services/layoutConfigService'
import type { BoardLayoutConfig, LayoutEditState } from '@/types/layoutConfig'
import { DEFAULT_LAYOUT_CONFIG } from '@/types/layoutConfig'
import { useUserStore } from '@/stores/user'
```

### 步骤 2: 添加状态变量

```typescript
// 用户 store
const userStore = useUserStore()

// 布局配置
const currentLayout = ref<BoardLayoutConfig>(JSON.parse(JSON.stringify(DEFAULT_LAYOUT_CONFIG)))

// 编辑状态
const layoutEditState = ref<LayoutEditState>({
  isEditing: false,
  selectedElement: null,
  showGrid: false,
  isDirty: false,
})
```

### 步骤 3: 加载配置

```typescript
// 在现有的 onMounted 中添加
onMounted(async () => {
  updateDeviceType()
  window.addEventListener('resize', updateDeviceType)

  // 加载布局配置
  await loadLayoutConfig()
})

// 新增函数
async function loadLayoutConfig() {
  if (!userStore.profile?.uid) {
    currentLayout.value = JSON.parse(JSON.stringify(DEFAULT_LAYOUT_CONFIG))
    return
  }

  const layout = await getLayoutForDeviceAndMode(
    userStore.profile.uid,
    deviceType.value,
    gameMode.value
  )
  currentLayout.value = layout
}

// 监听设备类型和游戏模式变化
watch([deviceType, gameMode], () => {
  loadLayoutConfig()
})
```

### 步骤 4: 添加处理函数

```typescript
// 切换编辑模式
function toggleLayoutEdit() {
  layoutEditState.value.isEditing = !layoutEditState.value.isEditing
  if (!layoutEditState.value.isEditing) {
    layoutEditState.value.selectedElement = null
  }
}

// 保存布局
async function handleSaveLayout() {
  if (!userStore.profile?.uid) {
    ElMessage.warning('请先登录')
    return
  }

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
    ElMessage.error('保存失败，请重试')
  }
}

// 重置布局
async function handleResetLayout() {
  if (!userStore.profile?.uid) {
    currentLayout.value = JSON.parse(JSON.stringify(DEFAULT_LAYOUT_CONFIG))
    layoutEditState.value.isDirty = true
    return
  }

  const success = await resetLayoutConfig(
    userStore.profile.uid,
    deviceType.value,
    gameMode.value
  )

  if (success) {
    await loadLayoutConfig()
    ElMessage.success('已重置为默认布局')
  } else {
    ElMessage.error('重置失败')
  }
}

// 取消编辑
function handleCancelEdit() {
  if (layoutEditState.value.isDirty) {
    if (confirm('有未保存的更改，确定要取消吗？')) {
      layoutEditState.value.isEditing = false
      layoutEditState.value.isDirty = false
      loadLayoutConfig() // 重新加载
    }
  } else {
    layoutEditState.value.isEditing = false
  }
}

// 更新公共牌位置
function updateCommunityCardsPosition(position: any) {
  currentLayout.value.communityCards.transform = {
    ...currentLayout.value.communityCards.transform,
    ...position
  }
  layoutEditState.value.isDirty = true
}

// 更新牌堆位置
function updateDeckPosition(position: any) {
  currentLayout.value.deck.transform = {
    ...currentLayout.value.deck.transform,
    ...position
  }
  layoutEditState.value.isDirty = true
}

// 更新玩家手牌位置
function updatePlayerPosition(seat: number, position: any) {
  currentLayout.value.playerHands.positions[seat] = {
    ...currentLayout.value.playerHands.positions[seat],
    ...position
  }
  layoutEditState.value.isDirty = true
}

// 计算样式
const communityCardsStyle = computed(() => ({
  top: currentLayout.value.communityCards.transform.top,
  left: currentLayout.value.communityCards.transform.left,
  transform: `scale(${currentCardScale.value * currentLayout.value.communityCards.transform.scale})`,
  transformOrigin: 'center center',
  width: `${currentLayout.value.communityCards.spacing * 5}px`,
}))

const deckStyle = computed(() => ({
  ...currentLayout.value.deck.transform,
  transform: `scale(${deckScale.value * currentLayout.value.deck.transform.scale}) translateX(-50%)`,
}))

function getPlayerStyle(seat: number) {
  const basePosition = currentLayout.value.playerHands.positions[seat]
  const rotation = playerPositions.value[seat - 1].transform

  return {
    ...basePosition,
    transform: `scale(${currentCardScale.value * currentLayout.value.playerHands.uniformScale}) ${rotation}`,
    transformOrigin: 'center center',
  }
}
```

### 步骤 5: 更新模板

在模板的合适位置添加：

```vue
<!-- 布局调整按钮（桌面端） -->
<button
  v-if="!isMobile"
  class="layout-adjust-btn"
  @click="toggleLayoutEdit"
  :class="{ active: layoutEditState.isEditing }"
>
  <el-icon><Setting /></el-icon>
  {{ layoutEditState.isEditing ? '退出调整' : '布局调整' }}
</button>

<!-- 布局调整按钮（移动端） -->
<button
  v-else
  class="mobile-layout-btn"
  @click="toggleLayoutEdit"
  :class="{ active: layoutEditState.isEditing }"
>
  <el-icon><Setting /></el-icon>
</button>

<!-- 编辑器工具栏 -->
<LayoutEditor
  v-model:layout-config="currentLayout"
  v-model:edit-state="layoutEditState"
  @save="handleSaveLayout"
  @reset="handleResetLayout"
  @cancel="handleCancelEdit"
/>

<!-- 网格辅助线 -->
<div v-if="layoutEditState.showGrid" class="layout-grid"></div>
```

包装现有元素：

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
  <div
    v-if="gameMode !== '7stud' && gameMode !== 'razz' && ..."
    class="community-cards-group"
    :style="communityCardsStyle"
  >
    <!-- 现有公共牌内容 -->
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

<!-- 玩家手牌 -->
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
    <!-- 现有手牌内容 -->
  </div>
</DraggableElement>
```

### 步骤 6: 添加样式

```vue
<style scoped>
  /* 布局调整按钮（桌面） */
  .layout-adjust-btn {
    position: fixed;
    top: 12px;
    right: 120px;
    z-index: 10003;
    padding: 8px 16px;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: #333;
    transition: all 0.3s;
  }

  .layout-adjust-btn:hover {
    border-color: #1976d2;
    color: #1976d2;
  }

  .layout-adjust-btn.active {
    background: #1976d2;
    color: #fff;
    border-color: #1976d2;
  }

  /* 移动端按钮 */
  .mobile-layout-btn {
    position: fixed;
    bottom: 80px;
    right: 12px;
    z-index: 10003;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
  }

  .mobile-layout-btn.active {
    background: #1976d2;
    color: #fff;
  }

  /* 网格辅助线 */
  .layout-grid {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    background-image:
      linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px);
    background-size: 50px 50px;
    z-index: 999;
  }
</style>
```

## 🔥 部署 Firebase Security Rules

1. 复制 `firestore.rules.example` 内容
2. 在 Firebase Console 中：
   - 进入 Firestore Database
   - 点击 "Rules" 标签
   - 粘贴规则
   - 点击 "发布"

## ✅ 完成检查清单

- [ ] 导入所有依赖
- [ ] 添加状态变量
- [ ] 实现加载配置函数
- [ ] 实现保存/重置/取消函数
- [ ] 包装所有可调整元素
- [ ] 添加布局调整按钮
- [ ] 添加样式
- [ ] 部署 Firebase 规则
- [ ] 测试桌面端功能
- [ ] 测试移动端功能
- [ ] 测试跨设备同步

## 🧪 测试步骤

1. **基础测试**
   - 点击"布局调整"进入编辑模式
   - 拖拽公共牌、牌堆、手牌
   - 使用 +/- 调整大小
   - 点击"保存"

2. **跨设备测试**
   - 调整桌面端布局并保存
   - 切换到移动端横屏，验证不影响
   - 调整移动端布局并保存
   - 回到桌面端，验证桌面配置未变

3. **跨游戏模式测试**
   - Hold'em 下调整布局
   - 切换到 Omaha，验证独立配置
   - 切回 Hold'em，验证配置保留

## 📚 参考文档

- `docs/LAYOUT_SYSTEM.md` - 完整系统设计
- `src/types/layoutConfig.ts` - 类型定义和注释
- `src/services/layoutConfigService.ts` - API 使用示例
