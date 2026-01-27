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
  import { update, initSession, flush, addDetail } from '@/trainer'
  import { createSessionContext } from '@/trainer/session/session.create'

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

  // 标志位：是否正在应用预设（用于避免手动修改时触发预设重置）
  const isApplyingCashPreset = ref(false)
  const isApplyingTournamentPreset = ref(false)
  // 标志位：是否是自动切换到"无预设"（此时不应用配置，只改变下拉框值）
  const isAutoSwitchingCashPreset = ref(false)
  const isAutoSwitchingTournamentPreset = ref(false)

  /* ================= 现金桌预设配置 ================= */
  const CASH_PRESETS = {
    none: {
      // 无预设时不修改颜色选择，保持用户当前的选择
      limits: {
        white1: 100,
        pink2: 100,
        brown3: 100,
        red5: 100,
        green25: 100,
        black100: 100,
        purple500: 100,
        yellow1k: 20,
        red5k: 20,
        green25k: 20,
      },
      minLimits: {
        white1: 0,
        pink2: 0,
        brown3: 0,
        red5: 0,
        green25: 0,
        black100: 0,
        purple500: 0,
        yellow1k: 0,
        red5k: 0,
        green25k: 0,
      },
    },
    red_rock_1_3: {
      colors: ['white1', 'pink2', 'red5', 'green25'],
      limits: {
        white1: 40,
        pink2: 20,
        brown3: 0,
        red5: 200,
        green25: 60,
        black100: 0,
        purple500: 0,
        yellow1k: 0,
        red5k: 0,
        green25k: 0,
      },
      minLimits: {
        white1: 0,
        pink2: 0,
        brown3: 0,
        red5: 0,
        green25: 0,
        black100: 0,
        purple500: 0,
        yellow1k: 0,
        red5k: 0,
        green25k: 0,
      },
    },
    red_rock_5_5: {
      colors: ['red5', 'green25', 'black100'],
      limits: {
        white1: 0,
        pink2: 0,
        brown3: 0,
        red5: 100,
        green25: 80,
        black100: 80,
        purple500: 0,
        yellow1k: 0,
        red5k: 0,
        green25k: 0,
      },
      minLimits: {
        white1: 0,
        pink2: 0,
        brown3: 0,
        red5: 0,
        green25: 0,
        black100: 0,
        purple500: 0,
        yellow1k: 0,
        red5k: 0,
        green25k: 0,
      },
    },
    wynn_1_3: {
      colors: ['white1', 'red5', 'green25', 'black100'],
      limits: {
        white1: 40,
        pink2: 0,
        brown3: 0,
        red5: 200,
        green25: 40,
        black100: 20,
        purple500: 0,
        yellow1k: 0,
        red5k: 0,
        green25k: 0,
      },
      minLimits: {
        white1: 0,
        pink2: 0,
        brown3: 0,
        red5: 0,
        green25: 0,
        black100: 0,
        purple500: 0,
        yellow1k: 0,
        red5k: 0,
        green25k: 0,
      },
    },
    red_rock_bank: {
      colors: ['white1', 'pink2', 'red5'],
      limits: {
        white1: 300,
        pink2: 300,
        brown3: 0,
        red5: 60,
        green25: 0,
        black100: 0,
        purple500: 0,
        yellow1k: 0,
        red5k: 0,
        green25k: 0,
      },
      minLimits: {
        white1: 20,
        pink2: 20,
        brown3: 0,
        red5: 1,
        green25: 0,
        black100: 0,
        purple500: 0,
        yellow1k: 0,
        red5k: 0,
        green25k: 0,
      },
    },
    wynn_bank: {
      colors: ['white1', 'pink2', 'red5', 'black100'],
      limits: {
        white1: 200,
        pink2: 70,
        brown3: 0,
        red5: 60,
        green25: 0,
        black100: 12,
        purple500: 0,
        yellow1k: 0,
        red5k: 0,
        green25k: 0,
      },
      minLimits: {
        white1: 10,
        pink2: 5,
        brown3: 0,
        red5: 2,
        green25: 0,
        black100: 0,
        purple500: 0,
        yellow1k: 0,
        red5k: 0,
        green25k: 0,
      },
    },
    wsop_bank: {
      colors: ['white1', 'pink2', 'red5'],
      limits: {
        white1: 200,
        pink2: 100,
        brown3: 0,
        red5: 25,
        green25: 0,
        black100: 0,
        purple500: 0,
        yellow1k: 0,
        red5k: 0,
        green25k: 0,
      },
      minLimits: {
        white1: 20,
        pink2: 5,
        brown3: 0,
        red5: 1,
        green25: 0,
        black100: 0,
        purple500: 0,
        yellow1k: 0,
        red5k: 0,
        green25k: 0,
      },
    },
    bellagio_bank: {
      colors: ['white1', 'brown3', 'red5', 'black100'],
      limits: {
        white1: 200,
        pink2: 0,
        brown3: 70,
        red5: 50,
        green25: 0,
        black100: 15,
        purple500: 0,
        yellow1k: 0,
        red5k: 0,
        green25k: 0,
      },
      minLimits: {
        white1: 15,
        pink2: 0,
        brown3: 5,
        red5: 5,
        green25: 0,
        black100: 1,
        purple500: 0,
        yellow1k: 0,
        red5k: 0,
        green25k: 0,
      },
    },
    bellagio_1_3: {
      colors: ['white1', 'brown3', 'red5', 'green25', 'black100'],
      limits: {
        white1: 25,
        pink2: 0,
        brown3: 10,
        red5: 120,
        green25: 40,
        black100: 10,
        purple500: 0,
        yellow1k: 0,
        red5k: 0,
        green25k: 0,
      },
      minLimits: {
        white1: 5,
        pink2: 0,
        brown3: 0,
        red5: 10,
        green25: 0,
        black100: 0,
        purple500: 0,
        yellow1k: 0,
        red5k: 0,
        green25k: 0,
      },
    },
    bellagio_2_5: {
      colors: ['white1', 'brown3', 'red5', 'green25', 'black100', 'purple500'],
      limits: {
        white1: 15,
        pink2: 0,
        brown3: 10,
        red5: 120,
        green25: 40,
        black100: 10,
        purple500: 5,
        yellow1k: 0,
        red5k: 0,
        green25k: 0,
      },
      minLimits: {
        white1: 5,
        pink2: 0,
        brown3: 0,
        red5: 10,
        green25: 0,
        black100: 0,
        purple500: 0,
        yellow1k: 0,
        red5k: 0,
        green25k: 0,
      },
    },
    wynn_2_5: {
      colors: ['white1', 'red5', 'green25', 'black100', 'purple500'],
      limits: {
        white1: 35,
        pink2: 0,
        brown3: 0,
        red5: 120,
        green25: 40,
        black100: 10,
        purple500: 5,
        yellow1k: 0,
        red5k: 0,
        green25k: 0,
      },
      minLimits: {
        white1: 0,
        pink2: 0,
        brown3: 0,
        red5: 10,
        green25: 0,
        black100: 0,
        purple500: 0,
        yellow1k: 0,
        red5k: 0,
        green25k: 0,
      },
    },
  }

  /* ================= 锦标赛预设配置 ================= */
  const TOURNAMENT_PRESETS = {
    none: {
      // 无预设时不修改颜色选择，保持用户当前的选择
      limits: {
        green25k: 60,
        black100: 100,
        purple500: 100,
        yellow1k: 100,
        red5k: 100,
        blue100k: 40,
        pink500k: 20,
        orange1m: 20,
        grey5m: 20,
      },
    },
    day1_early: {
      colors: ['black100', 'purple500', 'yellow1k', 'red5k', 'green25k'],
      limits: {
        green25k: 40,
        black100: 60,
        purple500: 40,
        yellow1k: 40,
        red5k: 40,
        blue100k: 0,
        pink500k: 0,
        orange1m: 0,
        grey5m: 0,
      },
    },
    day1_first_color_up: {
      colors: ['purple500', 'yellow1k', 'red5k', 'green25k', 'blue100k'],
      limits: {
        green25k: 25,
        black100: 0,
        purple500: 40,
        yellow1k: 40,
        red5k: 40,
        blue100k: 15,
        pink500k: 0,
        orange1m: 0,
        grey5m: 0,
      },
    },
    day1_second_color_up: {
      colors: ['yellow1k', 'red5k', 'green25k', 'blue100k'],
      limits: {
        green25k: 40,
        black100: 0,
        purple500: 0,
        yellow1k: 40,
        red5k: 60,
        blue100k: 40,
        pink500k: 0,
        orange1m: 0,
        grey5m: 0,
      },
    },
    day2_first_color_up: {
      colors: ['red5k', 'green25k', 'blue100k', 'pink500k'],
      limits: {
        green25k: 40,
        black100: 0,
        purple500: 0,
        yellow1k: 0,
        red5k: 60,
        blue100k: 60,
        pink500k: 40,
        orange1m: 0,
        grey5m: 0,
      },
    },
    day2_second_color_up: {
      colors: ['green25k', 'blue100k', 'pink500k', 'orange1m'],
      limits: {
        green25k: 60,
        black100: 0,
        purple500: 0,
        yellow1k: 0,
        red5k: 0,
        blue100k: 60,
        pink500k: 60,
        orange1m: 20,
        grey5m: 0,
      },
    },
    final_table: {
      colors: ['blue100k', 'pink500k', 'orange1m', 'grey5m'],
      limits: {
        green25k: 0,
        black100: 0,
        purple500: 0,
        yellow1k: 0,
        red5k: 0,
        blue100k: 40,
        pink500k: 60,
        orange1m: 40,
        grey5m: 20,
      },
    },
  }

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

    update({
      isCorrect,
      answerTimeMs,
    })

    if (!isCorrect) {
      addDetail({
        type: 'wrong_case',
        payload: {
          userAnswer: val,
          correctValue: correctValue.value,
          chipGroups: chipGroups.value,
        },
      })
    }

    // ⭐️ 只通知 session，是否 flush 由 session 决定
    await flush(false)

    if (isCorrect) {
      setTimeout(newRound, 700)
    }
  }

  function toggleShowAnswer() {
    showAnswer.value = !showAnswer.value
  }

  /* ================= gameType 切换 = Session 边界 ================= */
  watch(gameType, async (type, prevType) => {
    if (type === prevType) return

    // ⭐️ 只要 session 里有题，就强制 flush
    await flush(true)

    // ⚠️ 不要再 initSession！
    // SessionManager 在 flush 后已经 reset

    userInput.value = ''
    feedback.value = 'idle'

    if (type === 'tournament') {
      tournamentInputRef.value?.reset()
    }

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

  /* ================= 初始化 Session（来自 store） ================= */
  watch(
    () => userStore.profile,
    (profile) => {
      if (!profile) return

      initSession(
        createSessionContext({ uid: profile.uid, email: profile.email }, 'chip', gameType.value)
      )
    },
    { immediate: true }
  )

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
