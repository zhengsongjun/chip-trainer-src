<script setup lang="ts">
  import { computed } from 'vue'

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
  <div v-if="visible" class="context-menu" :style="{ left: `${x}px`, top: `${y}px` }" @click.stop>
    <div class="menu-item" @click="emit('mark-high', seat)">
      <span class="menu-icon">🔴</span>
      <span>Mark as High</span>
    </div>

    <div v-if="showLow" class="menu-item" @click="emit('mark-low', seat)">
      <span class="menu-icon">🔵</span>
      <span>Mark as Low</span>
    </div>

    <div class="menu-item kill-item" @click="emit('mark-kill', seat)">
      <span class="menu-icon">❌</span>
      <span>Kill</span>
    </div>

    <div class="menu-divider"></div>

    <div class="menu-item clear-item" @click="emit('clear', seat)">
      <span class="menu-icon">↩️</span>
      <span>Clear</span>
    </div>
  </div>
</template>

<style scoped>
  .context-menu {
    position: fixed;
    background: #fff;
    border-radius: 8px;
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.15),
      0 0 0 1px rgba(0, 0, 0, 0.1);
    padding: 6px;
    min-width: 180px;
    z-index: 10000;
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    cursor: pointer;
    border-radius: 6px;
    font-size: 14px;
  }

  .menu-item:hover {
    background: #f5f5f5;
  }

  .kill-item:hover {
    background: #ffebee;
    color: #d32f2f;
  }

  .clear-item:hover {
    background: #e3f2fd;
    color: #1976d2;
  }

  .menu-divider {
    height: 1px;
    background: #e0e0e0;
    margin: 4px 0;
  }

  .menu-icon {
    width: 20px;
    text-align: center;
  }
</style>
