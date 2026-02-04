<script setup lang="ts">
  import { ref, watch, computed, onBeforeUnmount } from 'vue'

  const props = defineProps<{
    /** 是否处于编辑模式 */
    isEditing: boolean
    /** 是否被选中 */
    isSelected: boolean
    /** 元素 ID */
    elementId: string
    /** 初始位置 */
    initialPosition: {
      left?: string
      top?: string
      right?: string
      bottom?: string
    }
    /** 边框偏移配置（可选） */
    indicatorOffset?: {
      top: number
      right: number
      bottom: number
      left: number
    }
    /** 角点大小（可选） */
    cornerSize?: number
  }>()

  const emit = defineEmits<{
    (e: 'select'): void
    (e: 'positionChange', position: { left?: string; top?: string; right?: string; bottom?: string }): void
  }>()

  const containerRef = ref<HTMLElement | null>(null)
  const isDragging = ref(false)
  const dragOffset = { x: 0, y: 0 }
  const currentPosition = ref({ ...props.initialPosition })

  // 监听初始位置变化
  watch(() => props.initialPosition, (newPos) => {
    if (!isDragging.value) {
      currentPosition.value = { ...newPos }
    }
  }, { deep: true })

  function onMouseDown(e: MouseEvent) {
    if (!props.isEditing) return

    // 选中元素
    emit('select')

    const rect = containerRef.value!.getBoundingClientRect()
    const parentRect = containerRef.value!.parentElement!.getBoundingClientRect()

    dragOffset.x = e.clientX - rect.left
    dragOffset.y = e.clientY - rect.top

    isDragging.value = true
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)

    e.preventDefault()
    e.stopPropagation()
  }

  function onMouseMove(e: MouseEvent) {
    if (!isDragging.value || !containerRef.value) return

    const parentRect = containerRef.value.parentElement!.getBoundingClientRect()

    // 计算新位置（百分比）
    const newX = e.clientX - dragOffset.x - parentRect.left
    const newY = e.clientY - dragOffset.y - parentRect.top

    const leftPercent = (newX / parentRect.width) * 100
    const topPercent = (newY / parentRect.height) * 100

    // 放宽边界限制，允许更大范围的移动（-200% 到 300%）
    const boundedLeft = Math.max(-200, Math.min(300, leftPercent))
    const boundedTop = Math.max(-200, Math.min(300, topPercent))

    const newPosition = {
      left: `${boundedLeft.toFixed(2)}%`,
      top: `${boundedTop.toFixed(2)}%`,
    }

    // 实时更新位置
    currentPosition.value = newPosition
    emit('positionChange', newPosition)
  }

  function onMouseUp() {
    isDragging.value = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  onBeforeUnmount(() => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  })

  // 计算元素样式
  const elementStyle = computed(() => {
    // 始终应用绝对定位和位置，不管是否在编辑模式
    return {
      position: 'absolute',
      ...currentPosition.value
    }
  })

  // 计算边框样式
  const indicatorStyle = computed(() => {
    const offset = props.indicatorOffset || { top: -6, right: -6, bottom: -6, left: -6 }
    return {
      top: `${offset.top}px`,
      right: `${offset.right}px`,
      bottom: `${offset.bottom}px`,
      left: `${offset.left}px`,
    }
  })

  // 计算角点样式
  const cornerStyle = computed(() => {
    const size = props.cornerSize || 12
    return {
      width: `${size}px`,
      height: `${size}px`,
    }
  })
</script>

<template>
  <div
    ref="containerRef"
    class="draggable-element"
    :class="{
      editing: isEditing,
      selected: isSelected,
      dragging: isDragging,
    }"
    :style="elementStyle"
    @mousedown="onMouseDown"
  >
    <slot></slot>

    <!-- 编辑模式下的选中指示器 -->
    <div v-if="isEditing && isSelected" class="selection-indicator" :style="indicatorStyle">
      <div class="corner top-left" :style="cornerStyle"></div>
      <div class="corner top-right" :style="cornerStyle"></div>
      <div class="corner bottom-left" :style="cornerStyle"></div>
      <div class="corner bottom-right" :style="cornerStyle"></div>
    </div>
  </div>
</template>

<style scoped>
  .draggable-element {
    position: relative;
    transition: transform 0.1s ease;
  }

  .draggable-element.editing {
    cursor: move;
    outline: 2px dashed transparent;
    outline-offset: 4px;
  }

  .draggable-element.editing:hover {
    outline-color: rgba(25, 118, 210, 0.3);
  }

  /* 只在编辑模式时显示选中边框 */
  .draggable-element.editing.selected {
    outline: 2px solid #1976d2 !important;
    z-index: 1000;
  }

  .draggable-element.dragging {
    cursor: grabbing;
    opacity: 0.8;
  }

  .selection-indicator {
    position: absolute;
    pointer-events: none;
  }

  .corner {
    position: absolute;
    background: #1976d2;
    border: 2px solid #fff;
    border-radius: 50%;
  }

  .corner.top-left {
    top: 0;
    left: 0;
  }

  .corner.top-right {
    top: 0;
    right: 0;
  }

  .corner.bottom-left {
    bottom: 0;
    left: 0;
  }

  .corner.bottom-right {
    bottom: 0;
    right: 0;
  }
</style>
