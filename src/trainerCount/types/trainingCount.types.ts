/**
 * 统一的时间戳类型
 * 不直接绑定 firebase.Timestamp
 */
export type EpochMs = number

/**
 * 一次训练 Session（10 题）
 * 只存 summary 信息
 */
export interface TrainingSessionSummary<
  Mode extends string = string,
  SubMode extends string = string,
> {
  sessionId: string
  userId: string
  mode: Mode
  subMode?: SubMode
  durationMs: number
  createdAt: EpochMs
  endReason?: 'completed' | 'abandoned'
}

/**
 * 单题作答明细
 * 存在于 user_sessions/{sessionId}/answers
 */
export interface TrainingAnswerItem<
  Payload = unknown,
  Mode extends string = string,
  SubMode extends string = string,
> {
  isCorrect: boolean
  payload: Payload
  userAnswer: string | number
  answerTimeMs: number
  mode: Mode
  subMode?: SubMode
  answeredAt: EpochMs
}

/**
 * 内存态 Session（写入前）
 */
export interface TrainingSessionDraft<
  Payload = unknown,
  Mode extends string = string,
  SubMode extends string = string,
> {
  summary: TrainingSessionSummary<Mode, SubMode>
  answers: TrainingAnswerItem<Payload, Mode, SubMode>[]
}

/**
 * user_stats_daily
 * 一天一条，纯聚合表
 */
export interface TrainingDailyStats<Mode extends string = string, SubMode extends string = string> {
  userId: string
  date: string // YYYY-MM-DD

  // 全量
  totalQuestions: number
  correctCount: number
  totalDurationMs: number

  // 一级模块
  byMode: Record<
    Mode,
    {
      questions: number
      correct: number
      wrong: number
    }
  >

  // 二级模块
  bySubMode: Record<
    SubMode,
    {
      questions: number
      correct: number
      wrong: number
    }
  >

  updatedAt: number // EpochMs（写入时用 serverTimestamp）
}
