// stores/trainingRuntime.ts
import {
  EpochMs,
  TrainingAnswerItem,
  TrainingSessionDraft,
  TrainingSessionSummary,
} from '@/trainerCount/types/trainingCount.types'
import { defineStore } from 'pinia'

/* ========================
 * Types
 * ====================== */

export type DailyStatsDelta = {
  totalQuestions: number
  correctCount: number
  totalDurationMs: number
  byMode: Record<string, { questions: number; correct: number; wrong: number }>
  bySubMode: Record<string, { questions: number; correct: number; wrong: number }>
}

export type WrongDailyDelta<Mode extends string = string, SubMode extends string = string> = {
  totalWrong: number
  byMode: Record<Mode, number>
  bySubMode: Record<SubMode, number>
  sessionId: string
}

/* ========================
 * Store
 * ====================== */

export const useTrainingRuntimeStore = defineStore('trainingRuntime', {
  state: () => ({
    activeSession: null as TrainingSessionDraft<any, any, any> | null,
    dailyStatsDelta: null as DailyStatsDelta | null,
    wrongDailyDelta: null as WrongDailyDelta | null,
    status: 'idle' as 'idle' | 'running' | 'flushing',
  }),
  // stores/trainingRuntime.ts
  getters: {
    hasMeaningfulSession(state) {
      return !!(
        state.activeSession &&
        state.activeSession.answers &&
        state.activeSession.answers.length > 0
      )
    },
  },

  actions: {
    /* ========================
     * 初始化 session
     * ====================== */
    startSession(params: {
      sessionId: string
      userId: string
      mode: string
      subMode?: string
      createdAt: EpochMs
    }) {
      const summary: TrainingSessionSummary<any, any> = {
        sessionId: params.sessionId,
        userId: params.userId,
        mode: params.mode,
        subMode: params.subMode,
        durationMs: 0,
        createdAt: new Date(params.createdAt),
      }

      this.activeSession = {
        summary,
        answers: [],
      }

      this.dailyStatsDelta = {
        totalQuestions: 0,
        correctCount: 0,
        totalDurationMs: 0,
        byMode: {},
        bySubMode: {},
      }

      this.wrongDailyDelta = {
        totalWrong: 0,
        byMode: {},
        bySubMode: {},
        sessionId: params.sessionId,
      }

      this.status = 'running'
    },

    /* ========================
     * 记录一道题
     * ====================== */
    recordAnswer(item: TrainingAnswerItem<any, any, any>) {
      // session 不存在 = 已 reset / 未开始，直接丢弃
      if (!this.activeSession || !this.dailyStatsDelta || !this.wrongDailyDelta) {
        return
      }

      this.activeSession.answers.push(item)

      // dailyStatsDelta
      this.dailyStatsDelta.totalQuestions++
      if (item.isCorrect) this.dailyStatsDelta.correctCount++

      const mode = item.mode
      const subMode = item.subMode

      if (!this.dailyStatsDelta.byMode[mode]) {
        this.dailyStatsDelta.byMode[mode] = { questions: 0, correct: 0, wrong: 0 }
      }
      this.dailyStatsDelta.byMode[mode].questions++
      item.isCorrect
        ? this.dailyStatsDelta.byMode[mode].correct++
        : this.dailyStatsDelta.byMode[mode].wrong++

      if (subMode) {
        if (!this.dailyStatsDelta.bySubMode[subMode]) {
          this.dailyStatsDelta.bySubMode[subMode] = {
            questions: 0,
            correct: 0,
            wrong: 0,
          }
        }
        this.dailyStatsDelta.bySubMode[subMode].questions++
        item.isCorrect
          ? this.dailyStatsDelta.bySubMode[subMode].correct++
          : this.dailyStatsDelta.bySubMode[subMode].wrong++
      }

      // wrongDailyDelta
      if (!item.isCorrect) {
        this.wrongDailyDelta.totalWrong++
        this.wrongDailyDelta.byMode[mode] = (this.wrongDailyDelta.byMode[mode] ?? 0) + 1

        if (subMode) {
          this.wrongDailyDelta.bySubMode[subMode] =
            (this.wrongDailyDelta.bySubMode[subMode] ?? 0) + 1
        }
      }
    },

    /* ========================
     * 更新用时
     * ====================== */
    updateDuration(durationMs: number) {
      if (!this.activeSession || !this.dailyStatsDelta) return

      this.activeSession.summary.durationMs = durationMs
      this.dailyStatsDelta.totalDurationMs = durationMs
    },

    /* ========================
     * 强制结束 session（flush / fallback）
     * ====================== */
    reset() {
      this.activeSession = null
      this.dailyStatsDelta = null
      this.wrongDailyDelta = null
      this.status = 'idle'
    },
  },
})
