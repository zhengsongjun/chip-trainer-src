<script setup lang="ts">
  import { ref, computed } from 'vue'
  import PokerBoard from '../BoardAnalysis/components/PokerBoard.vue'
  import { HandStatus } from '../BoardAnalysis/components/PokerBoard.vue'

  /* ================= Mock 基础配置 ================= */

  const gameMode = ref<'holdem' | 'omaha' | '7stud'>('omaha')
  const gameType = ref<'high' | 'high-low'>('high-low')

  const activeSeats = ref([1, 3, 4, 6])

  const boardCards = ref(['as', 'kd', '7h', '7c', '2d'])

  const playerHands = ref<Record<number, string[]>>({
    1: ['ah', 'ad'],
    3: ['kc', 'kh'],
    4: ['7s', '7d'],
    6: ['2c', '2h'],
  })

  const playerStudCards = ref<Record<number, string[]>>({
    1: ['3h', '4d', '5s', '6c'],
    3: ['8h', '9d', 'ts', 'jc'],
    4: ['qd', 'qs', 'qh', 'qc'],
    6: ['ac', '2d', '3s', '4h'],
  })

  /* ================= 接收 PokerBoard 输出 ================= */

  const boardHandStatuses = ref<Record<number, HandStatus>>({})

  function onBoardChange(statuses: Record<number, HandStatus>) {
    boardHandStatuses.value = statuses
  }

  /* ================= 派生展示（模拟父组件） ================= */

  const selectedHighSeats = computed(() =>
    Object.entries(boardHandStatuses.value)
      .filter(([_, s]) => s === 'high' || s === 'both')
      .map(([seat]) => Number(seat))
  )

  const selectedLowSeats = computed(() =>
    Object.entries(boardHandStatuses.value)
      .filter(([_, s]) => s === 'low' || s === 'both')
      .map(([seat]) => Number(seat))
  )
</script>

<template>
  <div style="padding: 24px">
    <h2>PokerBoard 测试页</h2>

    <PokerBoard
      :active-seats="activeSeats"
      :player-hands="playerHands"
      :player-stud-cards="playerStudCards"
      :board-cards="boardCards"
      :game-mode="gameMode"
      :game-type="gameType"
      @change="onBoardChange"
    />

    <!-- 👇 模拟父组件看到的“用户答案” -->
    <div style="margin-top: 24px">
      <h3>用户选择结果（来自 PokerBoard）</h3>

      <pre>{{ boardHandStatuses }}</pre>

      <div>
        <strong>High Seats:</strong>
        {{ selectedHighSeats.join(', ') || '—' }}
      </div>

      <div>
        <strong>Low Seats:</strong>
        {{ selectedLowSeats.join(', ') || '—' }}
      </div>
    </div>
  </div>
</template>
