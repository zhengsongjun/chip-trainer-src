<script setup lang="ts">
import { ref,computed } from 'vue'
import ChipStack from '@/components/ChipStack.vue'
import GameConfigPanel from '@/components/GameConfigPanel.vue'
import { useCashGame } from '@/game/useCashGame'
import { useTournamentGame } from '@/game/useTournamentGame'
import AnswerPanel from '@/components/AnswerPanel.vue'
import ChipBoard from '@/components/ChipBoard.vue'
interface GameEngine {
  generate(): {
    groups: { color: string; count: number }[]
    total: number
  }
}

/* ================= 状态 ================= */

const round = ref(0)
const chipGroups = ref([])
const correctValue = ref(0)
const userInput = ref('')
const feedback = ref('idle')
const tournamentColors = ref<string[]>([
  'black100',
  'purple500',
  'yellow1k',
  'red5k',
  'green25k',
])

const blackRange = ref<'1-19' | '20-60'>('1-19')


// Element Plus 颜色选择（默认全选）
const enabledColors = ref(['green', 'red', 'white','black'])
const gameType = ref<'cash' | 'tournament'>('cash')

// 白色数量区间
const whiteRange = ref('1-20')
const showAnswer = ref(false)


function newRound() {
  round.value++
  userInput.value = ''
  feedback.value = 'idle'
  const { groups, total } = gameEngine.value.generate()
  chipGroups.value = groups
  correctValue.value = total
}


function onSubmit() {
  const val = Number(userInput.value)
  feedback.value = val === correctValue.value ? 'correct' : 'wrong'
  if (feedback.value === 'correct') setTimeout(newRound, 700)
}

function toggleShowAnswer() {
  showAnswer.value = !showAnswer.value
}

const gameEngine = computed(() => {
  if (gameType.value === 'tournament') {
    return useTournamentGame({
      colors: tournamentColors.value,
      blackRange: blackRange.value,
    })
  }

  return useCashGame({
    enabledColors: enabledColors.value,
    whiteRange: whiteRange.value,
  })
})


newRound()
</script>

<template>
  <main class="app">
    <header class="topbar">
      <h1>筹码反应训练</h1>
    </header>
    <GameConfigPanel
      v-model:gameType="gameType"
      v-model:enabledColors="enabledColors"
      v-model:whiteRange="whiteRange"
      v-model:tournamentColors="tournamentColors"
      v-model:blackRange="blackRange"
    />
    <ChipBoard :groups="chipGroups" />
    <!-- 答题 -->
    <AnswerPanel
      v-model="userInput"
      :feedback="feedback"
      :correctValue="correctValue"
      :showAnswer="showAnswer"
      @submit="onSubmit"
      @next="newRound"
      @toggleAnswer="toggleShowAnswer"
    />

  </main>
</template>

<style scoped>
input[type='number']::-webkit-outer-spin-button,
input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
}


.answer {
  margin-top: 16px;
  display: grid;
  gap: 10px;
}

input {
  padding: 10px;
  font-size: 16px;
}

input.correct {
  border: 1px solid #16a34a;
}

input.wrong {
  border: 1px solid #dc2626;
}

.actions {
  display: flex;
  gap: 8px;
}

.ok {
  color: #16a34a;
}

.err {
  color: #dc2626;
}

.filters {
  margin-bottom: 12px;
}
</style>
