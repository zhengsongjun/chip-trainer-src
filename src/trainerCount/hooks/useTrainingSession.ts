import { ref, shallowRef, watchEffect } from 'vue'
import { sessionState, setSession } from '@/stores/session'
import type {
  TrainingSessionDraft,
  TrainingSessionSummary,
  TrainingAnswerItem,
  EpochMs,
} from '../types/trainingCount.types'
import type { WrongDailyDoc } from '../types/WrongDaily.types'
import { writeTrainingSession } from '../writers/writeTrainingSession'
import { writeDailyStats } from '../writers/writeDailyStats'
import { writeWrongDaily } from '../writers/writeWrongDaily'

function now(): EpochMs {
  return Date.now()
}

const QUESTIONS_PER_SESSION = 10

type WrongAccumulator<Mode extends string, SubMode extends string> = {
  totalWrong: number
  byMode: Record<Mode, number>
  bySubMode: Record<SubMode, number>
  sessionId: string
}

export function useTrainingSession<
  Payload = unknown,
  Mode extends string = string,
  SubMode extends string = string,
>() {
  const session = shallowRef<TrainingSessionDraft<Payload, Mode, SubMode> | null>(
    sessionState.session
  )
  const isSubmitting = shallowRef(false)

  // ⭐ 错题累加器（仅内存）
  const wrongAccumulator = shallowRef<WrongAccumulator<Mode, SubMode> | null>(null)

  // 监听 sessionState 全局 session 更新
  watchEffect(() => {
    session.value = sessionState.session
    console.log('[训练] 同步全局 sessionState', session.value)
  })

  function startSession(params: {
    sessionId: string
    userId: string
    mode: Mode
    subMode?: SubMode
  }) {
    console.log('[训练] startSession', params)

    const summary: TrainingSessionSummary<Mode, SubMode> = {
      sessionId: params.sessionId,
      userId: params.userId,
      mode: params.mode,
      subMode: params.subMode,
      durationMs: 0,
      createdAt: new Date(),
    }

    session.value = {
      summary,
      answers: [],
    }

    // 初始化 wrongAccumulator
    wrongAccumulator.value = {
      totalWrong: 0,
      byMode: {} as Record<Mode, number>,
      bySubMode: {} as Record<SubMode, number>,
      sessionId: params.sessionId,
    }

    console.log('[训练] session 初始化完成', session.value)
    console.log('[训练] wrongAccumulator 初始化完成', wrongAccumulator.value)

    setSession(session.value)
  }

  function accumulateStats(session: TrainingSessionDraft<Payload, Mode, SubMode>) {
    console.log('[训练] 开始统计 session 数据', session)

    const byMode: any = {}
    const bySubMode: any = {}
    let correctCount = 0

    for (const a of session.answers) {
      if (a.isCorrect) correctCount++

      if (!byMode[a.mode]) {
        byMode[a.mode] = { questions: 0, correct: 0, wrong: 0 }
      }
      byMode[a.mode].questions++
      a.isCorrect ? byMode[a.mode].correct++ : byMode[a.mode].wrong++

      if (a.subMode) {
        if (!bySubMode[a.subMode]) {
          bySubMode[a.subMode] = { questions: 0, correct: 0, wrong: 0 }
        }
        bySubMode[a.subMode].questions++
        a.isCorrect ? bySubMode[a.subMode].correct++ : bySubMode[a.subMode].wrong++
      }
    }

    const result = {
      totalQuestions: session.answers.length,
      correctCount,
      totalDurationMs: session.summary.durationMs,
      byMode,
      bySubMode,
    }

    console.log('[训练] session 统计结果', result)
    return result
  }

  async function finishAndFlush() {
    if (isSubmitting.value) {
      console.warn('[训练] 正在提交中，忽略重复提交')
      return
    }

    if (!session.value || !wrongAccumulator.value) {
      console.warn('[训练] 无法提交：session 或 wrongAccumulator 不存在')
      return
    }

    isSubmitting.value = true
    console.log('[训练] 开始提交当前 session')

    const finished = session.value
    const createdAt = new Date(finished.summary.createdAt)

    finished.summary.durationMs = Date.now() - createdAt.getTime()
    console.log('[训练] 计算 session 用时', finished.summary.durationMs)

    const statsDelta = accumulateStats(finished)

    const wrongDailyDraft = {
      totalWrong: wrongAccumulator.value.totalWrong,
      byMode: wrongAccumulator.value.byMode,
      bySubMode: wrongAccumulator.value.bySubMode,
      sessionIds: [wrongAccumulator.value.sessionId],
      updatedAt: Date.now(),
    }

    console.log('[训练] wrongDailyDraft 准备完成', wrongDailyDraft)

    await writeTrainingSession(finished)
    console.log('[训练] training_session 写入成功')

    await writeDailyStats(finished.summary.userId, createdAt.toISOString().slice(0, 10), statsDelta)
    console.log('[训练] daily_stats 写入成功')

    // ⭐ 新增：写 wrong_daily
    await writeWrongDaily({
      userId: finished.summary.userId,
      date: createdAt.toISOString().slice(0, 10),
      delta: wrongDailyDraft,
    })
    console.log('[训练] wrong_daily 写入成功')

    console.log('[训练] session 提交成功')

    const prevSummary = finished.summary

    const nextSessionId = crypto.randomUUID()

    setSession({
      summary: {
        sessionId: nextSessionId,
        userId: prevSummary.userId,
        mode: prevSummary.mode,
        subMode: prevSummary.subMode,
        durationMs: 0,
        createdAt: now(),
      },
      answers: [],
    })

    // ⭐ 关键：为“下一轮”重新初始化 wrongAccumulator
    wrongAccumulator.value = {
      totalWrong: 0,
      byMode: {} as Record<Mode, number>,
      bySubMode: {} as Record<SubMode, number>,
      sessionId: nextSessionId,
    }

    console.log('[训练] 新一轮 session 已自动开启')

    isSubmitting.value = false
  }

  function answerQuestion(answer: Omit<TrainingAnswerItem<Payload, Mode, SubMode>, 'answeredAt'>) {
    if (isSubmitting.value) {
      console.warn('[训练] 当前正在提交答案，请稍后再试')
      return
    }

    if (!session.value || !wrongAccumulator.value) {
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

    session.value.answers.push(item)

    console.log('[训练] 答案已提交', {
      count: session.value.answers.length,
      isCorrect: item.isCorrect,
      mode: item.mode,
      subMode: item.subMode,
    })

    if (!item.isCorrect) {
      wrongAccumulator.value.totalWrong++
      wrongAccumulator.value.byMode[item.mode] = (wrongAccumulator.value.byMode[item.mode] ?? 0) + 1

      if (item.subMode) {
        wrongAccumulator.value.bySubMode[item.subMode] =
          (wrongAccumulator.value.bySubMode[item.subMode] ?? 0) + 1
      }

      console.log('[训练] 错题累计', wrongAccumulator.value)
    }

    if (session.value.answers.length >= QUESTIONS_PER_SESSION) {
      console.log('[训练] 已答满 10 题，开始提交')
      finishAndFlush()
    }
  }

  return {
    session,
    startSession,
    answerQuestion,
  }
}
