<script setup lang="ts">
  import { ref, watch } from 'vue'
  import useBoardAnalysisTrainingI18n from '@/i18n/customHook/useBoardAnalysis'

  const {
    trainingMode,
    type,
    playerCount: ConfigplayerCount,
    submit,
    nextQuestion,
  } = useBoardAnalysisTrainingI18n()
  const playerCount = ref(2)
  const gameMode = ref<'holdem' | 'omaha' | 'bigo'>('omaha')
  const gameType = ref<'high' | 'high-low'>('high')

  /**
   * 仅抛出事件，不关心逻辑
   */
  const emit = defineEmits<{
    (e: 'change-player-count', value: number): void
    (e: 'change-game-mode', value: 'holdem' | 'omaha' | 'bigo'): void
    (e: 'change-game-type', value: 'high' | 'high-low'): void
    (e: 'submit'): void
    (e: 'next'): void
  }>()

  function onPlayerChange(value: number) {
    emit('change-player-count', value)
  }

  function onGameModeChange(value: 'holdem' | 'omaha' | 'bigo') {
    emit('change-game-mode', value)
  }

  function onGameTypeChange(value: 'high' | 'high-low') {
    emit('change-game-type', value)
  }

  function onSubmit() {
    emit('submit')
  }

  function onNext() {
    emit('next')
  }

  // Hold'em 不能比 Low，自动切换为 High
  watch(gameMode, (newMode) => {
    if (newMode === 'holdem' && gameType.value === 'high-low') {
      gameType.value = 'high'
      emit('change-game-type', 'high')
    }
  })
</script>

<template>
  <div class="ui-panel board-config-bar">
    <!-- 左侧：配置 -->
    <div class="config-left">
      <span class="config-label">{{ trainingMode }}</span>
      <el-select
        :teleported="false"
        v-model="gameMode"
        size="small"
        style="width: 140px"
        @change="onGameModeChange"
      >
        <el-option label="Hold'em" value="holdem" />
        <el-option label="Omaha" value="omaha" />
        <el-option label="Big O" value="bigo" />
      </el-select>

      <span class="config-label">{{ type }}</span>
      <el-select
        :teleported="false"
        v-model="gameType"
        size="small"
        style="width: 120px"
        @change="onGameTypeChange"
      >
        <el-option label="High" value="high" />
        <el-option label="High Low" value="high-low" :disabled="gameMode === 'holdem'" />
      </el-select>

      <span class="config-label">{{ ConfigplayerCount }}</span>
      <el-select
        :teleported="false"
        v-model="playerCount"
        size="small"
        style="width: 120px"
        @change="onPlayerChange"
      >
        <el-option v-for="n in 7" :key="n + 1" :label="`${n + 1} 人`" :value="n + 1" />
      </el-select>
    </div>

    <!-- 右侧：操作 -->
    <div class="config-right">
      <el-button size="small" @click="onSubmit"> {{ submit }} </el-button>

      <el-button size="small" type="default" @click="onNext"> {{ nextQuestion }} </el-button>
    </div>
  </div>
</template>

<style scoped>
  .board-config-bar {
    margin-top: var(--space-2);
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
