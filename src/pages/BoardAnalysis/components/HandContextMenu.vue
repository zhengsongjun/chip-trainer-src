<script setup lang="ts">
  import useBoardAnalysisTrainingI18n from '@/i18n/customHook/useBoardAnalysis'
  import { computed } from 'vue'
  import { Close } from '@element-plus/icons-vue'
  const { markHigh, markLow, kill, close } = useBoardAnalysisTrainingI18n()
  type HandStatus = 'none' | 'high' | 'low' | 'both' | 'kill' | 'hand' | 'board'
  const props = defineProps<{
    visible: boolean
    x: number
    y: number
    seat: number
    gameType: 'high' | 'high-low' | 'a5-low' | '2-7-low' | 'badugi' | 'lowball-a5-type' | 'lowball-27-type' | 'ari-type' | 'archie-type' | 'badacey-type' | 'badeucey-type' | 'double-board-high' | 'double-board-bestbest'
    gameMode: 'holdem' | 'omaha' | 'bigo' | '7stud' | 'razz' | 'razzdugi' | 'razzdeucey' | '5card-draw' | 'badugi' | 'lowball-a5' | 'lowball-27' | 'ari' | 'archie' | 'badacey' | 'badeucey' | 'drawmaha' | 'drawmaha-49' | 'drawmaha-zero' | 'drawmaha-27' | 'double-board-omaha' | 'double-board-bigo' | 'double-board-holdem'
    scale?: number
  }>()

  const emit = defineEmits<{
    (e: 'mark-high', seat: number): void
    (e: 'mark-low', seat: number): void
    (e: 'mark-kill', seat: number): void
    (e: 'clear', seat: number): void
    (e: 'mark-hand', seat: number): void
    (e: 'mark-board', seat: number): void
  }>()

  const showHigh = computed(() => {
    // Razz、Badugi、Lowball A-5 和 Lowball 2-7 模式下不显示 High
    // Ari、Archie、Badacey、Badeucey 和 Razzdugi 模式显示 High
    // Badacey 和 Badeucey 的 High 实际上是 Badugi
    // Double Board Omaha 模式显示 High（作为 Top 或 High）
    return props.gameMode !== 'razz' && props.gameMode !== 'badugi' && props.gameMode !== 'lowball-a5' && props.gameMode !== 'lowball-27' && props.gameMode !== 'drawmaha'
  })

  const showLow = computed(() => {
    return (
      props.gameType === 'high-low' && (props.gameMode === 'omaha' || props.gameMode === 'bigo' || props.gameMode === '7stud')
    ) || props.gameMode === 'razz' || props.gameMode === 'razzdugi' || props.gameMode === 'razzdeucey' || props.gameMode === 'badugi' || props.gameMode === 'lowball-a5' || props.gameMode === 'lowball-27' || props.gameMode === 'ari' || props.gameMode === 'archie' || props.gameMode === 'badacey' || props.gameMode === 'badeucey' || props.gameMode === 'double-board-omaha' || props.gameMode === 'double-board-bigo' || props.gameMode === 'double-board-holdem' // Double Board 模式也显示 Low（作为 Bottom 或 Low）
  })

  // Drawmaha 模式显示 Hand 和 Board
  const showDrawmahaOptions = computed(() => {
    return props.gameMode === 'drawmaha' || props.gameMode === 'drawmaha-49' || props.gameMode === 'drawmaha-zero' || props.gameMode === 'drawmaha-27'
  })

  // 计算当前座位的状态，用于决定显示哪些选项
  const currentStatus = computed(() => {
    // 这里需要从父组件获取当前座位的状态，但 HandContextMenu 没有直接访问的权限
    // 不过我们可以通过事件来切换状态
    return 'none' // 默认为 none
  })

  // Badacey、Badeucey、Razzdugi 和 Razzdeucey 模式下的标签文本
  const highLabel = computed(() => {
    if (props.gameMode === 'badacey') {
      return 'Mark Badugi'
    } else if (props.gameMode === 'badeucey') {
      return 'Mark Badeugi 2-7'
    } else if (props.gameMode === 'razzdugi') {
      return 'Mark Badugi'
    } else if (props.gameMode === 'razzdeucey') {
      return 'Mark Badugi 2-7'
    } else if ((props.gameMode === 'double-board-omaha' || props.gameMode === 'double-board-bigo' || props.gameMode === 'double-board-holdem') && props.gameType === 'double-board-high') {
      return 'Mark Top'
    } else if ((props.gameMode === 'double-board-omaha' || props.gameMode === 'double-board-bigo') && props.gameType === 'double-board-bestbest') {
      return 'Mark High'
    }
    return markHigh.value
  })

  const lowLabel = computed(() => {
    if (props.gameMode === 'badacey') {
      return 'Mark Lowball A-5'
    } else if (props.gameMode === 'badeucey') {
      return 'Mark Lowball 2-7'
    } else if (props.gameMode === 'razzdugi') {
      return 'Mark Razz Low'
    } else if (props.gameMode === 'razzdeucey') {
      return 'Mark Razz 2-7 Low'
    } else if ((props.gameMode === 'double-board-omaha' || props.gameMode === 'double-board-bigo' || props.gameMode === 'double-board-holdem') && props.gameType === 'double-board-high') {
      return 'Mark Bottom'
    } else if ((props.gameMode === 'double-board-omaha' || props.gameMode === 'double-board-bigo') && props.gameType === 'double-board-bestbest') {
      return 'Mark Low'
    }
    return markLow.value
  })
</script>

<template>
  <div
    v-if="visible"
    class="context-menu chip-stage"
    :style="{ left: `${x}px`, top: `${y}px` }"
    @click.stop
  >
    <!-- Drawmaha 模式的 Hand 和 Board 选项 -->
    <template v-if="showDrawmahaOptions">
      <div class="menu-item" @click="emit('mark-hand', seat)">
        <span class="menu-dot hand"></span>
        <span class="menu-text">Mark Hand</span>
      </div>
      <div class="menu-item" @click="emit('mark-board', seat)">
        <span class="menu-dot board"></span>
        <span class="menu-text">Mark Board</span>
      </div>
    </template>

    <div v-if="showHigh && !showDrawmahaOptions" class="menu-item" @click="emit('mark-high', seat)">
      <span class="menu-dot high"></span>
      <span class="menu-text">{{ highLabel }}</span>
    </div>

    <div v-if="showLow" class="menu-item" @click="emit('mark-low', seat)">
      <span class="menu-dot low"></span>
      <span class="menu-text">{{ lowLabel }}</span>
    </div>

    <div class="menu-item danger" @click="emit('mark-kill', seat)">
      <el-icon class="menu-icon-close">
        <Close />
      </el-icon>
      <span class="menu-text">{{ kill }}</span>
    </div>

    <div class="menu-divider"></div>

    <div class="menu-item subtle" @click="emit('clear', seat)">
      <span class="menu-dot clear"></span>
      <span class="menu-text">{{ close }}</span>
    </div>
  </div>
</template>

<style scoped>
  .context-menu {
    position: fixed;
    z-index: 10000;
    min-width: 160px;

    padding: 6px;
    border-radius: 10px;

    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(12px);

    box-shadow:
      0 2px 4px rgba(0, 0, 0, 0.04),
      0 12px 24px rgba(0, 0, 0, 0.08);

    font-size: var(--font-size-xs);
  }

  /* ================= menu item ================= */

  .menu-item {
    display: flex;
    align-items: center;
    gap: 8px;

    padding: 8px 10px;
    border-radius: 6px;
    cursor: pointer;

    color: var(--color-text-primary);
  }

  .menu-item:hover {
    background: rgba(0, 0, 0, 0.04);
  }

  /* ================= text ================= */

  .menu-text {
    white-space: nowrap;
  }

  /* ================= dots（语义标记） ================= */

  .menu-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .menu-dot.high {
    background: #d32f2f;
  }

  .menu-dot.low {
    background: #1976d2;
  }

  .menu-dot.clear {
    background: #9e9e9e;
  }

  .menu-dot.hand {
    background: #d32f2f;
  }

  .menu-dot.board {
    background: #1976d2;
  }

  /* ================= Close icon（kill） ================= */

  .menu-icon-close {
    font-size: 14px; /* 接近 el-dialog close */
    color: var(--color-text-secondary);
    opacity: 0.8;
  }

  .menu-item.danger:hover .menu-icon-close {
    color: var(--color-text-primary);
    opacity: 1;
  }

  /* kill 本身不做红色警告 */
  .menu-item.danger:hover {
    background: rgba(0, 0, 0, 0.04);
  }

  /* ================= subtle ================= */

  .menu-item.subtle {
    color: var(--color-text-secondary);
  }

  /* ================= divider ================= */

  .menu-divider {
    height: 1px;
    margin: 4px 0;
    background: rgba(0, 0, 0, 0.08);
  }
</style>
