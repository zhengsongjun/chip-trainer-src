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
  const gameMode = ref<'holdem' | 'omaha' | 'bigo' | '7stud' | 'razz' | 'badugi' | 'lowball-a5' | 'lowball-27' | 'ari' | 'archie' | 'badacey' | 'badeucey'>('omaha')
  const gameType = ref<'high' | 'high-low' | 'a5-low' | '2-7-low' | 'badugi' | 'lowball-a5-type' | 'lowball-27-type' | 'ari-type' | 'archie-type' | 'badacey-type' | 'badeucey-type'>('high')

  /**
   * 仅抛出事件，不关心逻辑
   */
  const emit = defineEmits<{
    (e: 'change-player-count', value: number): void
    (e: 'change-game-mode', value: 'holdem' | 'omaha' | 'bigo' | '7stud' | 'razz' | 'badugi' | 'lowball-a5' | 'lowball-27' | 'ari' | 'archie' | 'badacey' | 'badeucey'): void
    (e: 'change-game-type', value: 'high' | 'high-low' | 'a5-low' | '2-7-low' | 'badugi' | 'lowball-a5-type' | 'lowball-27-type' | 'ari-type' | 'archie-type' | 'badacey-type' | 'badeucey-type'): void
    (e: 'submit'): void
    (e: 'next'): void
  }>()

  function onPlayerChange(value: number) {
    emit('change-player-count', value)
  }

  function onGameModeChange(value: 'holdem' | 'omaha' | 'bigo' | '7stud' | 'razz' | 'badugi' | 'lowball-a5' | 'lowball-27' | 'ari' | 'archie' | 'badacey' | 'badeucey') {
    emit('change-game-mode', value)
  }

  function onGameTypeChange(value: 'high' | 'high-low' | 'a5-low' | '2-7-low' | 'badugi' | 'lowball-a5-type' | 'lowball-27-type' | 'ari-type' | 'archie-type' | 'badacey-type' | 'badeucey-type') {
    emit('change-game-type', value)
  }

  function onSubmit() {
    emit('submit')
  }

  function onNext() {
    emit('next')
  }

  // Hold'em 不能比 Low，自动切换为 High
  // Razz 只能比 Low，自动切换为 A-5 Low
  // Badugi 只能比 Badugi，自动切换为 Badugi
  // Lowball A-5 只能比 Lowball A-5
  // Lowball 2-7 只能比 Lowball 2-7
  // Ari 只能比 Ari (Hi-Low)
  // Archie 只能比 Archie (Hi-Low)
  // Badacey 只能比 Badacey (Badugi + A-5)
  // Badeucey 只能比 Badeucey (Badugi 2-7 + 2-7 Low)
  watch(gameMode, (newMode) => {
    if (newMode === 'holdem' && gameType.value === 'high-low') {
      gameType.value = 'high'
      emit('change-game-type', 'high')
    } else if (newMode === 'razz' && (gameType.value === 'high' || gameType.value === 'high-low' || gameType.value === 'badugi' || gameType.value === 'lowball-a5-type' || gameType.value === 'lowball-27-type' || gameType.value === 'ari-type' || gameType.value === 'archie-type' || gameType.value === 'badacey-type' || gameType.value === 'badeucey-type')) {
      gameType.value = 'a5-low'
      emit('change-game-type', 'a5-low')
    } else if (newMode === 'badugi' && gameType.value !== 'badugi') {
      gameType.value = 'badugi'
      emit('change-game-type', 'badugi')
    } else if (newMode === 'lowball-a5' && gameType.value !== 'lowball-a5-type') {
      gameType.value = 'lowball-a5-type'
      emit('change-game-type', 'lowball-a5-type')
    } else if (newMode === 'lowball-27' && gameType.value !== 'lowball-27-type') {
      gameType.value = 'lowball-27-type'
      emit('change-game-type', 'lowball-27-type')
    } else if (newMode === 'ari' && gameType.value !== 'ari-type') {
      gameType.value = 'ari-type'
      emit('change-game-type', 'ari-type')
    } else if (newMode === 'archie' && gameType.value !== 'archie-type') {
      gameType.value = 'archie-type'
      emit('change-game-type', 'archie-type')
    } else if (newMode === 'badacey' && gameType.value !== 'badacey-type') {
      gameType.value = 'badacey-type'
      emit('change-game-type', 'badacey-type')
    } else if (newMode === 'badeucey' && gameType.value !== 'badeucey-type') {
      gameType.value = 'badeucey-type'
      emit('change-game-type', 'badeucey-type')
    } else if (newMode !== 'razz' && newMode !== 'badugi' && newMode !== 'lowball-a5' && newMode !== 'lowball-27' && newMode !== 'ari' && newMode !== 'archie' && newMode !== 'badacey' && newMode !== 'badeucey' && (gameType.value === 'a5-low' || gameType.value === '2-7-low' || gameType.value === 'badugi' || gameType.value === 'lowball-a5-type' || gameType.value === 'lowball-27-type' || gameType.value === 'ari-type' || gameType.value === 'archie-type' || gameType.value === 'badacey-type' || gameType.value === 'badeucey-type')) {
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
        <el-option label="7 Card Stud" value="7stud" />
        <el-option label="Razz" value="razz" />
        <el-option label="Badugi" value="badugi" />
        <el-option label="Badacey A-5" value="badacey" />
        <el-option label="Badeucey 2-7" value="badeucey" />
        <el-option label="Lowball A-5" value="lowball-a5" />
        <el-option label="Lowball 2-7" value="lowball-27" />
        <el-option label="Ari" value="ari" />
        <el-option label="Archie" value="archie" />
      </el-select>

      <span class="config-label">{{ type }}</span>
      <el-select
        :teleported="false"
        v-model="gameType"
        size="small"
        style="width: 120px"
        @change="onGameTypeChange"
      >
        <el-option label="High" value="high" :disabled="gameMode === 'razz' || gameMode === 'badugi' || gameMode === 'lowball-a5' || gameMode === 'lowball-27' || gameMode === 'ari' || gameMode === 'archie' || gameMode === 'badacey' || gameMode === 'badeucey'" />
        <el-option label="High Low" value="high-low" :disabled="gameMode === 'holdem' || gameMode === 'razz' || gameMode === 'badugi' || gameMode === 'lowball-a5' || gameMode === 'lowball-27' || gameMode === 'ari' || gameMode === 'archie' || gameMode === 'badacey' || gameMode === 'badeucey'" />
        <el-option label="A-5 Low" value="a5-low" :disabled="gameMode !== 'razz'" />
        <el-option label="2-7 Low" value="2-7-low" :disabled="gameMode !== 'razz'" />
        <el-option label="Badugi" value="badugi" :disabled="gameMode !== 'badugi'" />
        <el-option label="Badacey A-5" value="badacey-type" :disabled="gameMode !== 'badacey'" />
        <el-option label="Badeucey 2-7" value="badeucey-type" :disabled="gameMode !== 'badeucey'" />
        <el-option label="Lowball A-5" value="lowball-a5-type" :disabled="gameMode !== 'lowball-a5'" />
        <el-option label="Lowball 2-7" value="lowball-27-type" :disabled="gameMode !== 'lowball-27'" />
        <el-option label="Ari (Hi-Low)" value="ari-type" :disabled="gameMode !== 'ari'" />
        <el-option label="Archie (Hi-Low)" value="archie-type" :disabled="gameMode !== 'archie'" />
      </el-select>

      <span class="config-label">{{ ConfigplayerCount }}</span>
      <el-select
        :teleported="false"
        v-model="playerCount"
        size="small"
        style="width: 120px"
        @change="onPlayerChange"
      >
        <el-option v-for="n in (gameMode === '7stud' || gameMode === 'razz' ? 5 : 7)" :key="n + 1" :label="`${n + 1} 人`" :value="n + 1" />
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
