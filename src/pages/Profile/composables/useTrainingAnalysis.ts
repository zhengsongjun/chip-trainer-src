import { ref, computed, watch, Ref } from 'vue'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '@/firebase'

/* ========================
 * Types
 * ====================== */

export type TimeRange =
  | { type: 'all' }
  | { type: '7d' }
  | { type: '30d' }
  | { type: 'custom'; start: number; end: number }

/* ========================
 * Hook
 * ====================== */

export function useTrainingAnalysis(options: { userId: Ref<string>; range: Ref<TimeRange> }) {
  const loading = ref(false)
  const error = ref<Error | null>(null)

  const sessions = ref<any[]>([])
  const wrongCases = ref<any[]>([])

  /* ========================
   * Time Range → Firestore 条件
   * ====================== */
  const rangeCondition = computed(() => {
    const range = options.range.value
    const today = new Date()

    const format = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`

    switch (range.type) {
      case '7d': {
        const start = new Date(today)
        start.setDate(start.getDate() - 6)

        return {
          startDate: format(start),
          endDate: format(today),
        }
      }

      case '30d': {
        const start = new Date(today)
        start.setDate(start.getDate() - 29)

        return {
          startDate: format(start),
          endDate: format(today),
        }
      }

      case 'custom':
        return {
          startDate: format(new Date(range.start)),
          endDate: format(new Date(range.end)),
        }

      default:
        return null
    }
  })

  /* ========================
   * Fetch Sessions（核心）
   * ====================== */
  const fetchSessions = async () => {
    const uid = options.userId.value
    if (!uid) return

    loading.value = true
    error.value = null
    console.log('rangeCondition', rangeCondition.value)
    try {
      const conditions = [where('userId', '==', uid)]

      if (rangeCondition.value) {
        conditions.push(
          where('date', '>=', rangeCondition.value.startDate),
          where('date', '<=', rangeCondition.value.endDate)
        )
      }

      const statsRef = collection(db, 'user_stats_daily')
      const q = query(statsRef, ...conditions)

      const snapshot = await getDocs(q)

      sessions.value = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      console.log('session.value', sessions.value)
    } catch (err: any) {
      error.value = err
      console.log(err)
    } finally {
      loading.value = false
    }
  }

  /* ========================
   * Watch（只监听必要的）
   * ====================== */
  watch(
    [() => options.userId.value, () => options.range.value],
    () => {
      fetchSessions()
    },
    { immediate: true, deep: true }
  )

  /* ========================
   * Summary（你之前写的是对的）
   * ====================== */
  const summary = computed(() => {
    if (!sessions.value.length) {
      return {
        totalDurationMs: 0,
        totalQuestions: 0,
        accuracy: 0,
        avgTimePerQuestionMs: 0,
      }
    }

    let totalDurationMs = 0
    let totalQuestions = 0
    let totalCorrect = 0

    sessions.value.forEach((s) => {
      const questions = Number(s.totalQuestions) || 0
      const correct = Number(s.correctCount) || 0
      const duration = Number(s.totalDurationMs) || 0

      totalQuestions += questions
      totalCorrect += correct
      totalDurationMs += duration
    })

    return {
      totalDurationMs,
      totalQuestions,
      accuracy: totalQuestions > 0 ? totalCorrect / totalQuestions : 0,
      avgTimePerQuestionMs: totalQuestions > 0 ? totalDurationMs / totalQuestions : 0,
    }
  })

  /* ========================
   * Daily stats（新的数据结构）
   * ====================== */
  const daily = computed(() => {
    return sessions.value.map((s) => {
      const byMode: Record<string, { questions: number; correct: number; wrong: number }> = {}

      // byMode 聚合（以你表结构为准）
      if (s.byMode) {
        Object.entries(s.byMode).forEach(([mode, v]: any) => {
          byMode[mode] = {
            questions: Number(v.questions) || 0,
            correct: Number(v.correct) || 0,
            wrong: Number(v.wrong) || 0,
          }
        })
      }

      const totalQuestions = Number(s.totalQuestions) || 0
      const correct = Number(s.correctCount) || 0
      const wrong = totalQuestions - correct

      return {
        date: s.date, // YYYY-MM-DD（非常重要）
        total: totalQuestions,
        correct,
        wrong,
        byMode,
      }
    })
  })

  /* ========================
   * Accuracy Trend（新的数据结构）
   * ====================== */
  const accuracyTrend = computed(() => {
    return [...sessions.value]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((s) => {
        const total = Number(s.totalQuestions) || 0
        const correct = Number(s.correctCount) || 0

        return {
          date: s.date,
          accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
        }
      })
  })

  /* ========================
   * Wrong Cases（保持不变）
   * ====================== */
  const fetchWrongCases = async () => {
    if (!sessions.value.length) {
      wrongCases.value = []
      return
    }

    const all: any[] = []

    for (const s of sessions.value) {
      const sessionId = s.sessionId || s.id
      if (!sessionId) continue

      const snap = await getDocs(collection(db, 'answers', sessionId, 'wrong_cases'))

      snap.forEach((doc) => {
        all.push({
          sessionId,
          ...doc.data(),
        })
      })
    }

    wrongCases.value = all
  }

  return {
    loading,
    error,
    sessions,
    wrongCases,
    summary,
    daily,
    accuracyTrend,
  }
}
