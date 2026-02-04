<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { Plus, Minus, Refresh, Check, Close } from '@element-plus/icons-vue'
  import { ElMessage } from 'element-plus'
  import type { BoardLayoutConfig, LayoutEditState } from '@/types/layoutConfig'

  const props = defineProps<{
    /** 当前布局配置 */
    layoutConfig: BoardLayoutConfig
    /** 编辑状态 */
    editState: LayoutEditState
  }>()

  const emit = defineEmits<{
    (e: 'update:layoutConfig', value: BoardLayoutConfig): void
    (e: 'update:editState', value: LayoutEditState): void
    (e: 'save'): void
    (e: 'reset'): void
    (e: 'cancel'): void
  }>()

  // 快捷调整方法
  function adjustScale(element: 'communityCards' | 'deck' | 'playerHands', delta: number) {
    const config = { ...props.layoutConfig }

    if (element === 'playerHands') {
      config.playerHands.uniformScale = Math.max(
        0.5,
        Math.min(2.0, config.playerHands.uniformScale + delta)
      )
    } else {
      config[element].transform.scale = Math.max(
        0.5,
        Math.min(2.0, config[element].transform.scale + delta)
      )
    }

    emit('update:layoutConfig', config)
    updateEditState({ isDirty: true })
  }

  function adjustSpacing(delta: number) {
    const config = { ...props.layoutConfig }
    config.communityCards.spacing = Math.max(50, Math.min(150, config.communityCards.spacing + delta))
    emit('update:layoutConfig', config)
    updateEditState({ isDirty: true })
  }

  function updateEditState(updates: Partial<LayoutEditState>) {
    emit('update:editState', { ...props.editState, ...updates })
  }

  function handleSave() {
    emit('save')
    updateEditState({ isDirty: false })
  }

  function handleReset() {
    emit('reset')
    updateEditState({ isDirty: false })
  }

  function handleCancel() {
    if (props.editState.isDirty) {
      if (confirm('有未保存的更改，确定要取消吗？')) {
        emit('cancel')
        updateEditState({ isEditing: false, isDirty: false })
      }
    } else {
      emit('cancel')
      updateEditState({ isEditing: false })
    }
  }

  const selectedElementLabel = computed(() => {
    const sel = props.editState.selectedElement
    if (!sel) return '未选择'
    if (sel === 'communityCards') return '公共牌'
    if (sel === 'deck') return '牌堆'
    if (sel.startsWith('player-')) {
      return `玩家 ${sel.split('-')[1]} 手牌`
    }
    return sel
  })
</script>

<template>
  <div class="layout-editor" v-if="editState.isEditing">
    <!-- 工具栏 -->
    <div class="editor-toolbar">
      <div class="toolbar-section">
        <span class="toolbar-label">布局调整模式</span>
        <span class="selected-element">{{ selectedElementLabel }}</span>
      </div>

      <div class="toolbar-section controls">
        <!-- 公共牌控制 -->
        <div class="control-group">
          <label>公共牌大小</label>
          <div class="scale-controls">
            <el-button
              size="small"
              :icon="Minus"
              @click="adjustScale('communityCards', -0.05)"
              circle
            />
            <span class="scale-value">{{ (layoutConfig.communityCards.transform.scale * 100).toFixed(0) }}%</span>
            <el-button
              size="small"
              :icon="Plus"
              @click="adjustScale('communityCards', 0.05)"
              circle
            />
          </div>
        </div>

        <div class="control-group">
          <label>公共牌间距</label>
          <div class="scale-controls">
            <el-button size="small" :icon="Minus" @click="adjustSpacing(-5)" circle />
            <span class="scale-value">{{ layoutConfig.communityCards.spacing }}px</span>
            <el-button size="small" :icon="Plus" @click="adjustSpacing(5)" circle />
          </div>
        </div>

        <!-- 牌堆控制 -->
        <div class="control-group">
          <label>牌堆大小</label>
          <div class="scale-controls">
            <el-button size="small" :icon="Minus" @click="adjustScale('deck', -0.05)" circle />
            <span class="scale-value">{{ (layoutConfig.deck.transform.scale * 100).toFixed(0) }}%</span>
            <el-button size="small" :icon="Plus" @click="adjustScale('deck', 0.05)" circle />
          </div>
        </div>

        <!-- 手牌控制 -->
        <div class="control-group">
          <label>手牌大小（统一）</label>
          <div class="scale-controls">
            <el-button size="small" :icon="Minus" @click="adjustScale('playerHands', -0.05)" circle />
            <span class="scale-value">{{ (layoutConfig.playerHands.uniformScale * 100).toFixed(0) }}%</span>
            <el-button size="small" :icon="Plus" @click="adjustScale('playerHands', 0.05)" circle />
          </div>
        </div>

        <!-- 网格辅助线 -->
        <el-checkbox
          v-model="editState.showGrid"
          @change="updateEditState({ showGrid: $event as boolean })"
        >
          显示网格
        </el-checkbox>
      </div>

      <div class="toolbar-section actions">
        <el-button size="small" type="primary" :icon="Check" @click="handleSave" :disabled="!editState.isDirty">
          保存
        </el-button>
        <el-button size="small" :icon="Refresh" @click="handleReset">
          重置
        </el-button>
        <el-button size="small" :icon="Close" @click="handleCancel">
          取消
        </el-button>
      </div>
    </div>

    <!-- 提示信息 -->
    <div class="editor-hint">
      <p>💡 拖动元素调整位置，使用 +/- 按钮调整大小</p>
      <p v-if="editState.isDirty" class="dirty-hint">⚠️ 有未保存的更改</p>
    </div>
  </div>
</template>

<style scoped>
  .layout-editor {
    position: fixed;
    top: 70px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10005;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(12px);
    border-radius: 12px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
    padding: 16px 20px;
    min-width: 800px;
  }

  .editor-toolbar {
    display: flex;
    align-items: center;
    gap: 24px;
    flex-wrap: wrap;
  }

  .toolbar-section {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .toolbar-section.controls {
    flex: 1;
    flex-wrap: wrap;
  }

  .toolbar-label {
    font-weight: 600;
    font-size: 14px;
    color: #333;
  }

  .selected-element {
    font-size: 13px;
    color: #1976d2;
    padding: 4px 12px;
    background: #e3f2fd;
    border-radius: 6px;
  }

  .control-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .control-group label {
    font-size: 12px;
    color: #666;
    white-space: nowrap;
  }

  .scale-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .scale-value {
    font-size: 13px;
    font-weight: 600;
    color: #333;
    min-width: 45px;
    text-align: center;
  }

  .editor-hint {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #e5e7eb;
  }

  .editor-hint p {
    margin: 4px 0;
    font-size: 12px;
    color: #666;
  }

  .dirty-hint {
    color: #ff9800 !important;
    font-weight: 600;
  }

  /* 移动端适配 */
  @media (max-width: 1024px) {
    .layout-editor {
      min-width: unset;
      width: 95vw;
      max-width: 600px;
      padding: 12px 16px;
    }

    .editor-toolbar {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
    }

    .toolbar-section {
      flex-direction: column;
      align-items: stretch;
    }

    .toolbar-section.controls {
      gap: 8px;
    }

    .control-group {
      justify-content: space-between;
    }
  }
</style>
