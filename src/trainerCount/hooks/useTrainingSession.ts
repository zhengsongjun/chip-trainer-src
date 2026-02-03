import { computed, shallowRef } from 'vue'
import { useTrainingRuntimeStore } from '@/stores/trainingRuntime'
import type {
  TrainingSessionDraft,
  TrainingAnswerItem,
  EpochMs,
} from '../types/trainingCount.types'
import { writeTrainingSession } from '../writers/writeTrainingSession'
import { writeDailyStats } from '../writers/writeDailyStats'
import { writeWrongDaily } from '../writers/writeWrongDaily'

function now(): EpochMs {
  return Date.now()
}

const QUESTIONS_PER_SESSION = 10

export function useTrainingSession<
  Payload = unknown,
  Mode extends string = string,
  SubMode extends string = string,
>() {
  const runtimeStore = useTrainingRuntimeStore()
  const isSubmitting = shallowRef(false)

  /**
   * ⭐ 对外暴露的 session
   * 实际数据来自 Pinia（唯一真源）
   */
  const session = computed<TrainingSessionDraft<Payload, Mode, SubMode> | null>(
    () => runtimeStore.activeSession as any
  )

  /* ========================
   * 开始 Session
   * ====================== */
  function startSession(params: {
    sessionId: string
    userId: string
    mode: Mode
    subMode?: SubMode
  }) {
    runtimeStore.startSession({
      sessionId: params.sessionId,
      userId: params.userId,
      mode: params.mode,
      subMode: params.subMode,
      createdAt: now(),
    })
  }

  /* ========================
   * 提交答案
   * ====================== */
  function answerQuestion(answer: Omit<TrainingAnswerItem<Payload, Mode, SubMode>, 'answeredAt'>) {
    if (isSubmitting.value) {
      console.warn('[训练] 当前正在提交答案，请稍后再试')
      return
    }

    if (!runtimeStore.activeSession) {
      console.warn('[训练] 无法提交答案：没有活动的 session')
      return
    }

    const item: TrainingAnswerItem<Payload, Mode, SubMode> = {
      isCorrect: answer.isCorrect,
      payload: answer.payload,
      userAnswer: answer.userAnswer,
      answerTimeMs: answer.answerTimeMs,
      mode: answer.mode,
      subMode: answer.subMode,
      answeredAt: Date.now(),
    }

    // ⭐ 统一走 Pinia
    runtimeStore.recordAnswer(item)

    const count = runtimeStore.activeSession.answers.length

    if (count >= QUESTIONS_PER_SESSION) {
      console.log('[训练] 已答满 10 题，开始提交')
      finishAndFlush()
    }
  }

  /* ========================
   * 正常 Flush（10 题）
   * ====================== */
  async function finishAndFlush() {
    if (isSubmitting.value) return
    if (
      !runtimeStore.activeSession ||
      !runtimeStore.dailyStatsDelta ||
      !runtimeStore.wrongDailyDelta
    ) {
      console.warn('[训练] 无法提交：运行时数据不完整')
      return
    }

    isSubmitting.value = true
    runtimeStore.status = 'flushing'

    const sessionDraft = runtimeStore.activeSession
    const createdAt = new Date(sessionDraft.summary.createdAt)

    // 计算用时
    const durationMs = Date.now() - createdAt.getTime()
    runtimeStore.updateDuration(durationMs)

    try {
      // 1️⃣ 写 session
      await writeTrainingSession(sessionDraft)

      // 2️⃣ 写 daily_stats
      await writeDailyStats(
        sessionDraft.summary.userId,
        createdAt.toISOString().slice(0, 10),
        runtimeStore.dailyStatsDelta
      )

      // 3️⃣ 写 wrong_daily
      await writeWrongDaily({
        userId: sessionDraft.summary.userId,
        date: createdAt.toISOString().slice(0, 10),
        delta: {
          totalWrong: runtimeStore.wrongDailyDelta.totalWrong,
          byMode: runtimeStore.wrongDailyDelta.byMode,
          bySubMode: runtimeStore.wrongDailyDelta.bySubMode,
          sessionIds: [runtimeStore.wrongDailyDelta.sessionId],
          updatedAt: Date.now(),
        },
      })

      console.log('[训练] session 提交成功')

      // 自动开启下一轮 session
      const prev = sessionDraft.summary
      const nextSessionId = crypto.randomUUID()

      runtimeStore.startSession({
        sessionId: nextSessionId,
        userId: prev.userId,
        mode: prev.mode,
        subMode: prev.subMode,
        createdAt: now(),
      })
    } finally {
      isSubmitting.value = false
      runtimeStore.status = 'running'
    }
  }

  return {
    session,
    startSession,
    answerQuestion,
  }
}
