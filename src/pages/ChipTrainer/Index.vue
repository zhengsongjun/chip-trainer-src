<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import TournamentAnswerInput from './components/TournamentAnswerInput.vue'
  import GameConfigPanel from './components/GameConfigPanel.vue'
  import ChipBoard from './components/ChipBoard.vue'
  import AnswerActions from './components/AnswerActions.vue'
  import { useTournamentGame } from './customHooks/useTournamentGame'
  import { CashColor, useCashGame } from './customHooks/useCashGame'
  import { TournamentColor } from './utils/tournamentConfig'
  import useChipTrainingI18n from '../../i18n/customHook/chipTraining/useChipTraining'
  import useUISystem from '@/i18n/customHook/UI/useUISystem'
  import { useUserStore } from '@/stores/user'
  import { CASH_PRESETS, type CashPresetKey } from './presetsConfig/cashPresets'
  import { TOURNAMENT_PRESETS, type TournamentPresetKey } from './presetsConfig/tournamentPresets'
  import { useTrainingSession } from '@/trainerCount/hooks/useTrainingSession'
  const { startSession, answerQuestion } = useTrainingSession()
  /* ================= i18n ================= */
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
    pink,
    brown,
    orange,
    grey,
    blue,
  } = useChipTrainingI18n()

  const { save, cancel } = useUISystem()

  /* ================= store ================= */
  const userStore = useUserStore()

  /* ================= 基础状态 ================= */
  const tournamentInputRef = ref<InstanceType<typeof TournamentAnswerInput> | null>(null)

  const round = ref(0) // UI 展示用
  const questionStartAt = ref(Date.now())

  const chipGroups = ref<any[]>([])
  const correctValue = ref(0)
  const userInput = ref('')
  const feedback = ref<'idle' | 'correct' | 'wrong'>('idle')

  /* ================= 模式 ================= */
  const gameType = ref<'cash' | 'tournament'>('cash')
  const canSubmit = computed(() => {
    return userInput.value.trim().length > 0
  })
  const cashPreset = ref<CashPresetKey>('none')
  const tournamentPreset = ref<TournamentPresetKey>('none')
  const tournamentColors = ref<TournamentColor[]>([
    'green25k',
    'black100',
    'purple500',
    'yellow1k',
    'red5k',
    'grey5m',
    'orange1m',
    'blue100k',
    'pink500k',
  ])

  const enabledColors = ref<CashColor[]>([
    'white1',
    'red5',
    'green25',
    'black100',
    'pink2',
    'purple500',
    'brown3',
    'yellow1k',
    'red5k',
    'green25k',
  ])

  const showAnswer = ref(false)
  const showChipConfig = ref(false)
  const hasRecordedWrong = ref(false)
  // 标志位：是否正在应用预设（用于避免手动修改时触发预设重置）
  const isApplyingCashPreset = ref(false)
  const isApplyingTournamentPreset = ref(false)
  // 标志位：是否是自动切换到"无预设"（此时不应用配置，只改变下拉框值）
  const isAutoSwitchingCashPreset = ref(false)
  const isAutoSwitchingTournamentPreset = ref(false)

  /* ================= 筹码配置 ================= */
  const cashChipLimits = ref({
    white1: 100,
    red5: 100,
    green25: 100,
    black100: 100,
    pink2: 100,
    purple500: 100,
    brown3: 100,
    yellow1k: 20,
    red5k: 20,
    green25k: 20,
  })

  const cashChipMinLimits = ref({
    white1: 0,
    red5: 0,
    green25: 0,
    black100: 0,
    pink2: 0,
    purple500: 0,
    brown3: 0,
    yellow1k: 0,
    red5k: 0,
    green25k: 0,
  })

  const tournamentChipLimits = ref({
    green25k: 60,
    black100: 100,
    purple500: 100,
    yellow1k: 100,
    red5k: 100,
    blue100k: 40,
    pink500k: 20,
    orange1m: 20,
    grey5m: 20,
  })

  /* ================= 出题 ================= */
  function newRound() {
    hasRecordedWrong.value = false
    round.value++
    userInput.value = ''
    feedback.value = 'idle'
    const { groups, total } = gameEngine.value.generate()
    chipGroups.value = groups as any
    correctValue.value = total
    showAnswer.value = false
    questionStartAt.value = Date.now()
  }

  /* ================= 保存配置 ================= */
  function saveChipConfig() {
    showChipConfig.value = false
    userInput.value = ''
    feedback.value = 'idle'

    if (gameType.value === 'tournament') {
      tournamentInputRef.value?.reset()
    }

    newRound()
  }

  /* ================= 核心：提交答案 ================= */

  async function onSubmit() {
    if (!canSubmit.value) return

    const val = Number(userInput.value)

    const isCorrect =
      gameType.value === 'tournament'
        ? val * 100 === correctValue.value
        : val === correctValue.value

    feedback.value = isCorrect ? 'correct' : 'wrong'
    userInput.value = ''

    const answerTimeMs = Date.now() - questionStartAt.value

    // ===============================
    // ⭐ Session 统计去重逻辑（仅在 index.vue）
    // ===============================

    if (isCorrect) {
      // ✅ 正确：永远允许写入 session
      answerQuestion({
        isCorrect: true,
        answerTimeMs,
        payload: {
          correctValue: correctValue.value,
          chipGroups: chipGroups.value,
          preset: gameType.value === 'cash' ? cashPreset.value : tournamentPreset.value,
        },
        userAnswer: val,
        mode: 'chip',
        subMode: gameType.value,
      })

      // 正确后进入下一题
      setTimeout(newRound, 700)
      return
    }

    // ❌ 错误的情况
    if (!hasRecordedWrong.value) {
      // ⭐ 第一次答错：写入 session
      answerQuestion({
        isCorrect: false,
        answerTimeMs,
        payload: {
          correctValue: correctValue.value,
          chipGroups: chipGroups.value,
          preset: gameType.value === 'cash' ? cashPreset.value : tournamentPreset.value,
        },
        userAnswer: val,
        mode: 'chip',
        subMode: gameType.value,
      })

      hasRecordedWrong.value = true
    }

    // ⭐ 后续重复答错：什么都不做（只更新 UI feedback）
  }

  function toggleShowAnswer() {
    showAnswer.value = !showAnswer.value
  }

  /* ================= gameType 切换 = Session 边界 ================= */
  watch(gameType, async (type, prevType) => {
    if (type === prevType) return

    userInput.value = ''
    feedback.value = 'idle'

    if (type === 'tournament') {
      tournamentInputRef.value?.reset()
    }

    newRound()
  })

  watch(tournamentPreset, (key) => {
    if (key === 'none') {
      newRound()
      return
    }

    const preset = TOURNAMENT_PRESETS[key]
    if (!preset || !preset.limits) return

    // ⭐️ 1️⃣ 直接盖弹窗里的 limits（包括 0）
    tournamentChipLimits.value = {
      ...tournamentChipLimits.value,
      ...preset.limits,
    }

    // ⭐️ 2️⃣ 如果 preset 定义了颜色，就直接用它
    if (preset.colors) {
      tournamentColors.value = [...preset.colors]
    }

    // ⭐️ 3️⃣ 切换 preset = 新一轮
    newRound()
  })

  /* ================= 颜色切换只影响出题 ================= */
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
  watch(cashPreset, (key) => {
    if (key === 'none') {
      newRound()
      return
    }

    const preset = CASH_PRESETS[key]
    if (!preset || !preset.limits) return

    // ⭐️ 直接盖弹窗里的值（包括 0）
    cashChipLimits.value = {
      ...cashChipLimits.value,
      ...preset.limits,
    }

    // 如果你希望：只用 preset 里的颜色（可选）
    if (preset.colors) {
      enabledColors.value = [...preset.colors]
    }

    // ⭐️ 切换 preset = 新一轮
    newRound()
  })

  watch(cashPreset, () => {
    // 切换现金赛 preset，立刻开启新一轮
    newRound()
  })

  /* ================= 游戏引擎 ================= */
  const gameEngine = computed(() => {
    return gameType.value === 'tournament'
      ? useTournamentGame({
          colors: tournamentColors.value,
          limits: tournamentChipLimits.value,
        })
      : useCashGame({
          enabledColors: enabledColors.value,
          limits: cashChipLimits.value,
        })
  })

  startSession({
    sessionId: crypto.randomUUID(),
    userId: userStore.profile!.uid,
    mode: 'chip',
    subMode: gameType.value,
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
          v-model:cashPreset="cashPreset"
          v-model:tournamentPreset="tournamentPreset"
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
              :can-submit="canSubmit"
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
              :can-submit="canSubmit"
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
            <span class="config-label">{{ white }} ($1)</span>
            <el-input-number v-model="cashChipLimits.white1" :min="0" :max="1000" />
          </div>
          <div class="config-item">
            <span class="config-label">{{ pink }}($2)</span>
            <el-input-number v-model="cashChipLimits.pink2" :min="0" :max="1000" />
          </div>
          <div class="config-item">
            <span class="config-label">{{ brown }}($3)</span>
            <el-input-number v-model="cashChipLimits.brown3" :min="0" :max="1000" />
          </div>
          <div class="config-item">
            <span class="config-label">{{ red }} ($5)</span>
            <el-input-number v-model="cashChipLimits.red5" :min="0" :max="1000" />
          </div>
          <div class="config-item">
            <span class="config-label">{{ green }} ($25)</span>
            <el-input-number v-model="cashChipLimits.green25" :min="0" :max="1000" />
          </div>
          <div class="config-item">
            <span class="config-label">{{ black }} ($100)</span>
            <el-input-number v-model="cashChipLimits.black100" :min="0" :max="1000" />
          </div>
          <div class="config-item">
            <span class="config-label">{{ purple }} ($500)</span>
            <el-input-number v-model="cashChipLimits.purple500" :min="0" :max="1000" />
          </div>
          <div class="config-item">
            <span class="config-label">{{ gold }} ($1k)</span>
            <el-input-number v-model="cashChipLimits.yellow1k" :min="0" :max="50" />
          </div>
          <div class="config-item">
            <span class="config-label">{{ red }} ($5k)</span>
            <el-input-number v-model="cashChipLimits.red5k" :min="0" :max="50" />
          </div>
          <div class="config-item">
            <span class="config-label">{{ green }} ($25k)</span>
            <el-input-number v-model="cashChipLimits.green25k" :min="0" :max="30" />
          </div>
        </div>
      </section>

      <el-divider />

      <!-- ========== 锦标赛配置 ========== -->
      <!-- ========== 锦标赛配置 ========== -->
      <section class="config-section">
        <h3 class="config-title">{{ tournamentGame }}</h3>

        <div class="config-grid">
          <!-- 按面额从小到大排列 -->
          <div class="config-item">
            <span class="config-label">{{ black }} (100)</span>
            <el-input-number v-model="tournamentChipLimits.black100" :min="0" :max="100" />
          </div>

          <div class="config-item">
            <span class="config-label">{{ purple }} (500)</span>
            <el-input-number v-model="tournamentChipLimits.purple500" :min="0" :max="100" />
          </div>

          <div class="config-item">
            <span class="config-label">{{ gold }} (1k)</span>
            <el-input-number v-model="tournamentChipLimits.yellow1k" :min="0" :max="100" />
          </div>

          <div class="config-item">
            <span class="config-label">{{ red }} (5k)</span>
            <el-input-number v-model="tournamentChipLimits.red5k" :min="0" :max="100" />
          </div>

          <div class="config-item">
            <span class="config-label">{{ green }} (25k)</span>
            <el-input-number v-model="tournamentChipLimits.green25k" :min="0" :max="100" />
          </div>

          <div class="config-item">
            <span class="config-label">{{ blue }} (100k)</span>
            <el-input-number v-model="tournamentChipLimits.blue100k" :min="0" :max="100" />
          </div>

          <div class="config-item">
            <span class="config-label">{{ pink }} (500k)</span>
            <el-input-number v-model="tournamentChipLimits.pink500k" :min="0" :max="100" />
          </div>

          <div class="config-item">
            <span class="config-label">{{ orange }} (1M)</span>
            <el-input-number v-model="tournamentChipLimits.orange1m" :min="0" :max="100" />
          </div>

          <div class="config-item">
            <span class="config-label">{{ grey }} (5M)</span>
            <el-input-number v-model="tournamentChipLimits.grey5m" :min="0" :max="100" />
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
