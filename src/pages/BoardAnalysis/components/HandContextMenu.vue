<script setup lang="ts">
  import useBoardAnalysisTrainingI18n from '@/i18n/customHook/useBoardAnalysis'
  import { computed } from 'vue'
  import { Close } from '@element-plus/icons-vue'
  const { markHigh, markLow, kill, close } = useBoardAnalysisTrainingI18n()
  type HandStatus = 'none' | 'high' | 'low' | 'both' | 'kill'
  const props = defineProps<{
    visible: boolean
    x: number
    y: number
    seat: number
    gameType: 'high' | 'high-low'
    gameMode: 'holdem' | 'omaha' | 'bigo'
  }>()

  const emit = defineEmits<{
    (e: 'mark-high', seat: number): void
    (e: 'mark-low', seat: number): void
    (e: 'mark-kill', seat: number): void
    (e: 'clear', seat: number): void
  }>()

  const showLow = computed(() => {
    return (
      props.gameType === 'high-low' && (props.gameMode === 'omaha' || props.gameMode === 'bigo')
    )
  })
</script>

<template>
  <div
    v-if="visible"
    class="context-menu chip-stage"
    :style="{ left: `${x}px`, top: `${y}px` }"
    @click.stop
  >
    <div class="menu-item" @click="emit('mark-high', seat)">
      <span class="menu-dot high"></span>
      <span class="menu-text">{{ markHigh }}</span>
    </div>

    <div v-if="showLow" class="menu-item" @click="emit('mark-low', seat)">
      <span class="menu-dot low"></span>
      <span class="menu-text">{{ markLow }}</span>
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
