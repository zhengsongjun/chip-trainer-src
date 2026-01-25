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
    'green25k',
    'black100',
    'purple500',
    'yellow1k',
    'red5k',
    'grey5m',
    'orange1m',
    'blue100k',
  ])

  const enabledColors = ref<CashColor[]>([
    'white',
    'red',
    'green',
    'black',
    'pink',
    'purple',
    'brown',
  ])
  const gameType = ref<'cash' | 'tournament'>('cash')

  const showAnswer = ref(false)
  const showChipConfig = ref(false)

  /* ================= 筹码配置 ================= */
  const cashChipLimits = ref({
    white1: 100,
    red5: 100,
    green25: 100,
    black100: 100,
    pink50: 100,
    purple500: 100,
    brown1000: 100,
  })

  const tournamentChipLimits = ref({
    green25k: 100,
    black100: 100,
    purple500: 100,
    yellow1k: 100,
    red5k: 100,
    blue100k: 100,
    orange1m: 20,
    grey5m: 20,
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
  <div class="ui-page">
    <div class="ui-stage">
      <div class="ui-stage chip-trainer">
        <!-- 顶部：标题 + 配置（Panel） -->
        <div class="ui-panel trainer-header">
          <h1 class="page-title">{{ pageTitle }}</h1>
          <el-button type="primary" @click="showChipConfig = true">
            {{ chipLimitConfig }}
          </el-button>
        </div>

        <!-- 游戏配置（控制面板） -->
        <GameConfigPanel
          v-model:gameType="gameType"
          v-model:enabledColors="enabledColors"
          v-model:tournamentColors="tournamentColors"
        />

        <section class="chip-stage">
          <ChipBoard :groups="chipGroups" />
        </section>

        <!-- 答题区（Panel） -->
        <div class="ui-panel answer-panel">
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
        </div>
      </div>
    </div>
  </div>
  <el-dialog v-model="showChipConfig" :title="chipConfig" width="640px" align-center>
    <!-- Dialog 内容体 -->
    <div class="ui-dialog-body">
      <!-- ========== 现金赛配置 ========== -->
      <section class="config-section">
        <h3 class="config-title">{{ cashGame }}</h3>

        <div class="config-grid">
          <div class="config-item">
            <span class="config-label">{{ white }} (1)</span>
            <el-input-number v-model="cashChipLimits.white1" :min="0" :max="1000" />
          </div>
          <div class="config-item">
            <span class="config-label">{{ red }} (5)</span>
            <el-input-number v-model="cashChipLimits.red5" :min="0" :max="1000" />
          </div>
          <div class="config-item">
            <span class="config-label">{{ green }} (25)</span>
            <el-input-number v-model="cashChipLimits.green25" :min="0" :max="1000" />
          </div>
          <div class="config-item">
            <span class="config-label">{{ black }} (100)</span>
            <el-input-number v-model="cashChipLimits.black100" :min="0" :max="1000" />
          </div>
          <div class="config-item">
            <span class="config-label">Pink</span>
            <el-input-number v-model="cashChipLimits.pink" :min="0" :max="1000" />
          </div>

          <div class="config-item">
            <span class="config-label">Purple</span>
            <el-input-number v-model="cashChipLimits.purple" :min="0" :max="1000" />
          </div>

          <div class="config-item">
            <span class="config-label">Brown</span>
            <el-input-number v-model="cashChipLimits.brown" :min="0" :max="1000" />
          </div>
        </div>
      </section>

      <el-divider />

      <!-- ========== 锦标赛配置 ========== -->
      <!-- ========== 锦标赛配置 ========== -->
      <section class="config-section">
        <h3 class="config-title">{{ tournamentGame }}</h3>

        <div class="config-grid">
          <!-- 可多枚的低面额筹码 -->
          <div class="config-item">
            <span class="config-label">{{ green }} (25k)</span>
            <el-input-number v-model="tournamentChipLimits.green25k" :min="0" :max="1000" />
          </div>

          <div class="config-item">
            <span class="config-label">{{ black }} (100)</span>
            <el-input-number v-model="tournamentChipLimits.black100" :min="0" :max="1000" />
          </div>

          <!-- ===== 稀有筹码：只能 0 / 1 ===== -->

          <div class="config-item">
            <span class="config-label">{{ purple }} (500)</span>
            <el-input-number v-model="tournamentChipLimits.purple500" :min="0" :max="1000" />
          </div>

          <div class="config-item">
            <span class="config-label">{{ gold }} (1k)</span>
            <el-input-number v-model="tournamentChipLimits.yellow1k" :min="0" :max="1000" />
          </div>

          <div class="config-item">
            <span class="config-label">{{ red }} (5k)</span>
            <el-input-number v-model="tournamentChipLimits.red5k" :min="0" :max="1000" />
          </div>

          <div class="config-item">
            <span class="config-label">Blue (100k)</span>
            <el-input-number v-model="tournamentChipLimits.blue100k" :min="0" :max="1000" />
          </div>

          <div class="config-item">
            <span class="config-label">Orange (1M)</span>
            <el-input-number v-model="tournamentChipLimits.orange1m" :min="0" :max="20" />
          </div>

          <div class="config-item">
            <span class="config-label">Grey (5M)</span>
            <el-input-number v-model="tournamentChipLimits.grey5m" :min="0" :max="20" />
          </div>
        </div>
      </section>
    </div>

    <!-- Footer -->
    <template #footer>
      <el-button @click="showChipConfig = false">
        {{ cancel }}
      </el-button>
      <el-button type="primary" @click="saveChipConfig">
        {{ save }}
      </el-button>
    </template>
  </el-dialog>

  <!-- ========== 主体 ========== -->
  <!-- ========== 主体 ========== -->
</template>

<style scoped>
  /* 页面标题 */
  .page-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
  }

  /* 顶部 Panel */
  .trainer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-4);
  }

  /* 答题区 Panel 内部 */
  .answer-panel {
    margin-top: var(--space-5);
  }

  /* 答题结构 */
  .answer {
    display: grid;
    gap: var(--space-3);
    justify-items: center;
  }

  /* 输入框宽度控制 */
  .el-input {
    max-width: 280px;
  }

  /* 正确 / 错误反馈（不写死颜色） */
  .el-input.correct .el-input__wrapper {
    border-color: var(--color-success);
  }

  .el-input.wrong .el-input__wrapper {
    border-color: var(--color-error);
  }

  /* 弹窗标题 */
  .config-title {
    margin: var(--space-1) 0 var(--space-2);
    font-weight: 600;
  }

  .chip-stage {
    margin: var(--space-6) 0;
    padding: var(--space-6) var(--space-4);

    /* 非卡片背景 */
    background: rgba(255, 255, 255, 0.6);

    /* 非卡片边界 */
    border-radius: 16px;

    /* 极弱托底阴影（关键） */
    box-shadow:
      0 2px 4px rgba(0, 0, 0, 0.04),
      0 12px 24px rgba(0, 0, 0, 0.08);
  }
</style>
