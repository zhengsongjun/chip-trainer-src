<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import GameConfigPanel from '@/components/GameConfigPanel.vue'
  import { useCashGame } from '@/game/useCashGame'
  import { useTournamentGame } from '@/game/useTournamentGame'
  import ChipBoard from '@/components/ChipBoard.vue'
  import AnswerActions from '@/components/AnswerActions.vue'
  import TournamentAnswerInput from '@/components/TournamentAnswerInput.vue'

  /* ================= 状态 ================= */
  const tournamentInputRef = ref<InstanceType<typeof TournamentAnswerInput> | null>(null)

  const round = ref(0)
  const chipGroups = ref([])
  const correctValue = ref(0)
  const userInput = ref('')
  const feedback = ref('idle')

  const tournamentColors = ref<string[]>(['black100', 'purple500', 'yellow1k', 'red5k', 'green25k'])

  const enabledColors = ref(['green', 'red', 'white', 'black'])
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
    chipGroups.value = groups
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

  function onSubmit() {
    const val = Number(userInput.value)
    const isCorrect = val === correctValue.value

    feedback.value = isCorrect ? 'correct' : 'wrong'

    if (gameType.value === 'tournament') {
      tournamentInputRef.value?.reset()
    } else {
      userInput.value = ''
    }

    if (isCorrect) {
      setTimeout(newRound, 700)
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
  <el-dialog v-model="showChipConfig" title="筹码最大数量配置" width="520px">
    <h3 class="config-title">现金桌</h3>

    <el-form label-width="120px">
      <el-form-item label="白色 (1)">
        <el-input-number v-model="cashChipLimits.white1" :min="0" :max="1000" />
      </el-form-item>
      <el-form-item label="红色 (5)">
        <el-input-number v-model="cashChipLimits.red5" :min="0" :max="1000" />
      </el-form-item>
      <el-form-item label="绿色 (25)">
        <el-input-number v-model="cashChipLimits.green25" :min="0" :max="1000" />
      </el-form-item>
      <el-form-item label="黑色 (100)">
        <el-input-number v-model="cashChipLimits.black100" :min="0" :max="1000" />
      </el-form-item>
    </el-form>

    <el-divider />

    <h3 class="config-title">锦标赛</h3>

    <el-form label-width="120px">
      <el-form-item label="绿色 (25)">
        <el-input-number v-model="tournamentChipLimits.green25" :min="0" :max="1000" />
      </el-form-item>
      <el-form-item label="黑色 (100)"
        ><el-input-number v-model="tournamentChipLimits.black100" :min="0" :max="1000" />
      </el-form-item>
      <el-form-item label="紫色 (500)">
        <el-input-number v-model="tournamentChipLimits.purple500" :min="0" :max="1000" />
      </el-form-item>
      <el-form-item label="金色 (1000)">
        <el-input-number v-model="tournamentChipLimits.gold1000" :min="0" :max="1000" />
      </el-form-item>
      <el-form-item label="红色 (5000)">
        <el-input-number v-model="tournamentChipLimits.red5000" :min="0" :max="1000" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="showChipConfig = false">取消</el-button>
      <el-button type="primary" @click="saveChipConfig">保存</el-button>
    </template>
  </el-dialog>

  <!-- ========== 主体 ========== -->
  <main class="app">
    <header class="topbar">
      <h1>筹码反应训练</h1>
      <el-button type="primary" @click="showChipConfig = true"> 筹码配置 </el-button>
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
        placeholder="请输入总数值"
        size="large"
        input-style="text-align: center; font-size: 20px;"
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
      <TournamentAnswerInput ref="tournamentInputRef" v-model="userInput" :length="7" />

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
