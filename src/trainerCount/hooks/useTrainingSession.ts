import { ref, shallowRef } from 'vue'
import type {
  TrainingSessionDraft,
  TrainingSessionSummary,
  TrainingAnswerItem,
  EpochMs,
} from '../types/trainingCount.types'
import { writeTrainingSession } from '../writers/writeTrainingSession'
import { writeDailyStats } from '../writers/writeDailyStats'

function now(): EpochMs {
  return Date.now()
}
const QUESTIONS_PER_SESSION = 10
export function useTrainingSession<
  Payload = unknown,
  Mode extends string = string,
  SubMode extends string = string,
>() {
  const session = shallowRef<TrainingSessionDraft<Payload, Mode, SubMode> | null>(null)
  const isSubmitting = shallowRef(false)

  function startSession(params: {
    sessionId: string
    userId: string
    mode: Mode
    subMode?: SubMode
  }) {
    const summary: TrainingSessionSummary<Mode, SubMode> = {
      sessionId: params.sessionId,
      userId: params.userId,
      mode: params.mode,
      subMode: params.subMode,
      durationMs: 0,
      createdAt: now(),
    }

    session.value = {
      summary,
      answers: [],
    }
  }

  function accumulateStats(session: TrainingSessionDraft<Payload, Mode, SubMode>) {
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

    return {
      totalQuestions: session.answers.length,
      correctCount,
      totalDurationMs: session.summary.durationMs,
      byMode,
      bySubMode,
    }
  }

  async function finishAndFlush() {
    if (isSubmitting.value) {
      console.warn('[训练] 正在提交中，忽略重复提交')
      return
    }

    if (!session.value) {
      console.warn('[训练] 无法提交：session 不存在')
      return
    }

    isSubmitting.value = true
    console.log('[训练] 开始提交当前 session')

    const finished = session.value
    finished.summary.durationMs = Date.now() - finished.summary.createdAt

    const statsDelta = accumulateStats(finished)

    await writeTrainingSession(finished)
    await writeDailyStats(
      finished.summary.userId,
      finished.summary.createdAt.toString().slice(0, 10),
      statsDelta
    )

    console.log('[训练] session 提交成功')

    const prevSummary = finished.summary

    session.value = {
      summary: {
        sessionId: crypto.randomUUID(),
        userId: prevSummary.userId,
        mode: prevSummary.mode,
        subMode: prevSummary.subMode,
        durationMs: 0,
        createdAt: now(),
      },
      answers: [],
    }

    isSubmitting.value = false
    console.log('[训练] 新一轮 session 已自动开启')
  }

  function answerQuestion(answer: Omit<TrainingAnswerItem<Payload, Mode, SubMode>, 'answeredAt'>) {
    if (!session.value) {
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
