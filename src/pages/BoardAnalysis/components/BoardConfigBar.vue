<script setup lang="ts">
  import { ref } from 'vue'

  const playerCount = ref(2)

  /**
   * 仅抛出事件，不关心逻辑
   */
  const emit = defineEmits<{
    (e: 'change-player-count', value: number): void
    (e: 'submit'): void
    (e: 'next'): void
  }>()

  function onPlayerChange(value: number) {
    emit('change-player-count', value)
  }

  function onSubmit() {
    emit('submit')
  }

  function onNext() {
    emit('next')
  }
</script>

<template>
  <div class="ui-panel board-config-bar">
    <!-- 左侧：配置 -->
    <div class="config-left">
      <span class="config-label">玩家数量</span>

      <el-select v-model="playerCount" size="small" style="width: 120px" @change="onPlayerChange">
        <el-option v-for="n in 7" :key="n + 1" :label="`${n + 1} 人`" :value="n + 1" />
      </el-select>
    </div>

    <!-- 右侧：操作 -->
    <div class="config-right">
      <el-button size="small" @click="onSubmit"> 提交 </el-button>

      <el-button size="small" type="default" @click="onNext"> 换一题 </el-button>
    </div>
  </div>
</template>

<style scoped>
  .board-config-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;

    padding: 12px 16px;
    margin-bottom: 16px;

    background: #fff;
    border-radius: 12px;
    box-shadow: var(--shadow-sm);
  }

  /* 左侧配置 */
  .config-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .config-label {
    font-size: 13px;
    color: var(--text-secondary, #666);
  }

  /* 右侧操作 */
  .config-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
</style>
