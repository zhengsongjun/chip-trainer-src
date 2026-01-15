<script setup lang="ts">
import { ref,computed ,watch} from 'vue'
import GameConfigPanel from '@/components/GameConfigPanel.vue'
import { useCashGame } from '@/game/useCashGame'
import { useTournamentGame } from '@/game/useTournamentGame'
import ChipBoard from '@/components/ChipBoard.vue'
import AnswerActions from '@/components/AnswerActions.vue'
import TournamentAnswerInput from "@/components/TournamentAnswerInput.vue"

/* ================= 状态 ================= */
const tournamentInputRef =
  ref<InstanceType<typeof TournamentAnswerInput> | null>(null)


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



// Element Plus 颜色选择（默认全选）
const enabledColors = ref(['green', 'red', 'white','black'])
const gameType = ref<'cash' | 'tournament'>('cash')

const showAnswer = ref(false)


function newRound() {
  round.value++
  userInput.value = ''
  feedback.value = 'idle'
  const { groups, total } = gameEngine.value.generate()
  chipGroups.value = groups
  correctValue.value = total
  showAnswer.value = false
}


function onSubmit() {
  const val = Number(userInput.value)

  const isCorrect = val === correctValue.value
  feedback.value = isCorrect ? 'correct' : 'wrong'

  // 提交后清空输入（不管对错）
  if (gameType.value === 'tournament') {
    tournamentInputRef.value?.reset()
  } else {
    userInput.value = ''
  }

  // ✅ 只有“答对”才自动换题
  if (isCorrect) {
    setTimeout(() => {
      newRound()
    }, 700) // 这个延迟你可以按体验调
  }
}



function toggleShowAnswer() {
  showAnswer.value = !showAnswer.value
}

const gameEngine = computed(() => {
  if (gameType.value === 'tournament') {
    return useTournamentGame({
      colors: tournamentColors.value,
    })
  }

  return useCashGame({
    enabledColors: enabledColors.value,
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
    <section v-if="gameType === 'cash'" class="answer">
  <!-- 原有 cash 输入 -->
  <input
    v-model="userInput"
    type="number"
    placeholder="请输入总数值"
    @keyup.enter="onSubmit"
    :class="feedback"
  />

  <AnswerActions
    :feedback="feedback"
    :showAnswer="showAnswer"
    :correctValue="correctValue"
    @submit="onSubmit"
    @next="newRound"
    @toggleAnswer="toggleShowAnswer"
  />
</section>

<section v-if="gameType === 'tournament'" class="answer">
  <TournamentAnswerInput
    ref="tournamentInputRef"
    v-model="userInput"
    :length="7"
  />

  <AnswerActions
    :feedback="feedback"
    :showAnswer="showAnswer"
    :correctValue="correctValue"
    @submit="onSubmit"
    @next="newRound"
    @toggleAnswer="toggleShowAnswer"
  />
</section>


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
