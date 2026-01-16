<script setup lang="ts">
  import TournamentAnswerInput from './components/TournamentAnswerInput.vue'
  import GameConfigPanel from './components/GameConfigPanel.vue'
  import ChipBoard from './components/ChipBoard.vue'
  import AnswerActions from './components/AnswerActions.vue'
  import { ref, computed, watch } from 'vue'
  import { useTournamentGame } from './customHooks/useTournamentGame'
  import { CashColor, useCashGame } from './customHooks/useCashGame'
  import { TournamentColor } from './utils/tournamentConfig'
  import useChipTrainingI18n from '../../i18n/customHook/chipTraining/useChipTraining'
  import useUISystem from '@/i18n/customHook/UI/useUISystem'
  const {
    pageTitle,
    chipConfig,
    chipLimitConfig,
    cashGame,
    tournamentGame,
    white,
    red,
    green,
    black,
    purple,
    inputPlaceholder,
    gold,
  } = useChipTrainingI18n()
  const { save, cancel } = useUISystem()
  const tournamentInputRef = ref<InstanceType<typeof TournamentAnswerInput> | null>(null)
  const round = ref(0)
  const chipGroups = ref([])
  const correctValue = ref(0)
  const userInput = ref('')
  const feedback = ref('idle')

  const tournamentColors = ref<TournamentColor[]>([
    'black100',
    'purple500',
    'yellow1k',
    'red5k',
    'green25k',
  ])

  const enabledColors = ref<CashColor[]>(['green', 'red', 'white', 'black'])
  const gameType = ref<'cash' | 'tournament'>('cash')

  const showAnswer = ref(false)
  const showChipConfig = ref(false)

  /* ================= 筹码配置 ================= */
  const cashChipLimits = ref({
    white1: 100,
    red5: 100,
    green25: 100,
    black100: 100,
  })

  const tournamentChipLimits = ref({
    green25: 100,
    black100: 100,
    purple500: 100,
    gold1000: 100,
    red5000: 100,
  })

  function saveChipConfig() {
    showChipConfig.value = false
    showChipConfig.value = false

    // 保存配置后，切换到新规则题目
    userInput.value = ''
    feedback.value = 'idle'

    if (gameType.value === 'tournament') {
      tournamentInputRef.value?.reset()
    }

    newRound()
  }

  /* ================= 出题 ================= */
  function newRound() {
    round.value++
    userInput.value = ''
    feedback.value = 'idle'

    const { groups, total } = gameEngine.value.generate()
    chipGroups.value = groups as any
    correctValue.value = total
    showAnswer.value = false
  }

  /* 切换模式自动切题 */
  watch(gameType, (type) => {
    userInput.value = ''
    feedback.value = 'idle'
    if (type === 'tournament') {
      tournamentInputRef.value?.reset()
    }
    newRound()
  })

  /* ================= 颜色切换 → 切题 ================= */
  watch(
    [enabledColors, tournamentColors],
    () => {
      userInput.value = ''
      feedback.value = 'idle'

      if (gameType.value === 'tournament') {
        tournamentInputRef.value?.reset()
      }

      newRound()
    },
    { deep: true }
  )

  function onSubmit() {
    const val = Number(userInput.value)

    const isCorrect =
      gameType.value === 'tournament'
        ? val * 100 === correctValue.value
        : val === correctValue.value

    feedback.value = isCorrect ? 'correct' : 'wrong'

    if (gameType.value === 'tournament') {
      tournamentInputRef.value?.reset()
    } else {
      userInput.value = ''
    }

    if (isCorrect) {
      setTimeout(() => {
        newRound()
      }, 700)
    }
  }

  function toggleShowAnswer() {
    showAnswer.value = !showAnswer.value
  }

  /* ================= 核心：接入 limits ================= */
  const gameEngine = computed(() => {
    if (gameType.value === 'tournament') {
      return useTournamentGame({
        colors: tournamentColors.value,
        limits: tournamentChipLimits.value,
      })
    }

    return useCashGame({
      enabledColors: enabledColors.value,
      limits: cashChipLimits.value,
    })
  })

  newRound()
</script>

<template>
  <!-- ========== 配置弹窗 ========== -->
  <el-dialog v-model="showChipConfig" :title="chipConfig" width="520px">
    <h3 class="config-title">{{ cashGame }}</h3>

    <el-form label-width="120px">
      <el-form-item :label="`${white} (1)`">
        <el-input-number v-model="cashChipLimits.white1" :min="0" :max="1000" />
      </el-form-item>
      <el-form-item :label="`${red} (5)`">
        <el-input-number v-model="cashChipLimits.red5" :min="0" :max="1000" />
      </el-form-item>
      <el-form-item :label="`${green} (25)`">
        <el-input-number v-model="cashChipLimits.green25" :min="0" :max="1000" />
      </el-form-item>
      <el-form-item :label="`${black} (100)`">
        <el-input-number v-model="cashChipLimits.black100" :min="0" :max="1000" />
      </el-form-item>
    </el-form>

    <el-divider />

    <h3 class="config-title">{{ tournamentGame }}</h3>
    <el-form label-width="120px">
      <el-form-item :label="`${green} (25)`">
        <el-input-number v-model="tournamentChipLimits.green25" :min="0" :max="1000" />
      </el-form-item>
      <el-form-item :label="`${black} (100)`"
        ><el-input-number v-model="tournamentChipLimits.black100" :min="0" :max="1000" />
      </el-form-item>
      <el-form-item :label="`${purple} (500)`">
        <el-input-number v-model="tournamentChipLimits.purple500" :min="0" :max="1000" />
      </el-form-item>
      <el-form-item :label="`${gold} (1000)`">
        <el-input-number v-model="tournamentChipLimits.gold1000" :min="0" :max="1000" />
      </el-form-item>
      <el-form-item :label="`${red} (5000)`">
        <el-input-number v-model="tournamentChipLimits.red5000" :min="0" :max="1000" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="showChipConfig = false">{{ cancel }}</el-button>
      <el-button type="primary" @click="saveChipConfig">{{ save }}</el-button>
    </template>
  </el-dialog>

  <!-- ========== 主体 ========== -->
  <main class="app">
    <header class="topbar">
      <h1>{{ pageTitle }}</h1>
      <el-button type="primary" @click="showChipConfig = true">
        {{ chipLimitConfig }}
      </el-button>
    </header>

    <GameConfigPanel
      v-model:gameType="gameType"
      v-model:enabledColors="enabledColors"
      v-model:tournamentColors="tournamentColors"
    />

    <ChipBoard :groups="chipGroups" />

    <!-- 答题 -->
    <section v-if="gameType === 'cash'" class="answer">
      <el-input
        v-model="userInput"
        :placeholder="inputPlaceholder"
        size="large"
        input-style="text-align: center; font-size: 20px;"
        @keyup.enter="onSubmit"
        :class="feedback"
      />

      <AnswerActions
        :feedback="feedback as any"
        :showAnswer="showAnswer"
        :correctValue="correctValue"
        @submit="onSubmit"
        @next="newRound"
        @toggleAnswer="toggleShowAnswer"
      />
    </section>

    <section v-if="gameType === 'tournament'" class="answer">
      <TournamentAnswerInput ref="tournamentInputRef" v-model="userInput" :length="7" />

      <AnswerActions
        :feedback="feedback as any"
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
  .app {
    max-width: 1200px;
    margin: 0 auto;
    padding: 16px;
  }

  .topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .answer {
    margin-top: 16px;
    display: grid;
    gap: 10px;
  }

  .config-title {
    margin: 4px 0 8px;
    font-weight: 600;
  }

  input.correct {
    border: 1px solid #16a34a;
  }

  input.wrong {
    border: 1px solid #dc2626;
  }

  .el-input {
    max-width: 280px; /* 不要拉满，很重要 */
  }

  .el-input.correct .el-input__wrapper {
    border-color: #16a34a;
  }

  .el-input.wrong .el-input__wrapper {
    border-color: #dc2626;
  }
</style>
