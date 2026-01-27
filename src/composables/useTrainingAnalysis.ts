// src/hooks/useTrainingAnalysis.ts
import { ref, computed, watch, Ref } from 'vue'
import { collection, query, where, getDocs } from 'firebase/firestore'
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
    const now = Date.now()
    const range = options.range.value

    switch (range.type) {
      case '7d':
        return {
          startAt: now - 7 * 24 * 60 * 60 * 1000,
          endAt: now,
        }
      case '30d':
        return {
          startAt: now - 30 * 24 * 60 * 60 * 1000,
          endAt: now,
        }
      case 'custom':
        return {
          startAt: range.start,
          endAt: range.end,
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

    try {
      const conditions = [where('userId', '==', uid)]

      if (rangeCondition.value) {
        conditions.push(
          where('startAt', '>=', rangeCondition.value.startAt),
          where('startAt', '<=', rangeCondition.value.endAt)
        )
      }

      const q = query(collection(db, 'training_stats'), ...conditions)

      const snapshot = await getDocs(q)

      sessions.value = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      await fetchWrongCases()
    } catch (err: any) {
      console.error('[useTrainingAnalysis] fetch error', err)
      error.value = err
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
    console.log('sessions', sessions)
    if (!sessions.value.length) {
      return {
        totalQuestions: 0,
        accuracy: 0,
        avgAnswerTimeMs: 0,
        medianAnswerTimeMs: 0,
      }
    }

    let totalQuestions = 0
    let totalCorrect = 0
    let weightedAvgTimeSum = 0
    let weightedMedianTimeSum = 0

    sessions.value.forEach((s) => {
      const count = s.totalCount ?? 0
      const correct = s.correctCount ?? 0

      totalQuestions += count
      totalCorrect += correct

      if (typeof s.avgAnswerTimeMs === 'number') {
        weightedAvgTimeSum += s.avgAnswerTimeMs * count
      }

      if (typeof s.medianAnswerTimeMs === 'number') {
        weightedMedianTimeSum += s.medianAnswerTimeMs * count
      }
    })

    return {
      totalQuestions,
      accuracy: totalQuestions > 0 ? totalCorrect / totalQuestions : 0,
      avgAnswerTimeMs: totalQuestions > 0 ? Math.round(weightedAvgTimeSum / totalQuestions) : 0,
      medianAnswerTimeMs:
        totalQuestions > 0 ? Math.round(weightedMedianTimeSum / totalQuestions) : 0,
    }
  })
  const daily = computed(() => {
    const map = new Map<string, number>()

    sessions.value.forEach((s) => {
      const ts = s.startAt
      const count = s.totalCount ?? 0
      if (!ts) return

      const d = new Date(ts)
      const key = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(
        2,
        '0'
      )}`

      map.set(key, (map.get(key) ?? 0) + count)
    })

    return Array.from(map.entries()).map(([date, count]) => ({
      date,
      count,
    }))
  })
  const accuracyTrend = computed(() => {
    const map = new Map<string, { total: number; correct: number }>()

    sessions.value.forEach((s) => {
      const ts = s.startAt
      if (!ts) return

      const total = s.totalCount ?? 0
      const wrong = s.wrongCount ?? 0
      const correct = total - wrong

      const d = new Date(ts)
      const key = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(
        2,
        '0'
      )}`

      const prev = map.get(key) ?? { total: 0, correct: 0 }
      map.set(key, {
        total: prev.total + total,
        correct: prev.correct + correct,
      })
    })

    return Array.from(map.entries()).map(([date, v]) => ({
      date,
      accuracy: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
    }))
  })

  const fetchWrongCases = async () => {
    if (!sessions.value.length) {
      wrongCases.value = []
      return
    }

    const all: any[] = []

    for (const s of sessions.value) {
      const sessionId = s.sessionId || s.id
      if (!sessionId) continue

      const snap = await getDocs(collection(db, 'training_stats', sessionId, 'wrong_cases'))

      snap.forEach((doc) => {
        all.push({
          sessionId,
          ...doc.data(),
        })
      })
    }

    wrongCases.value = all
  }

  const chipStructure = computed(() => {
    const full = new Map<string, number>()
    const split = new Map<string, number>()

    wrongCases.value.forEach((wc) => {
      const groups = wc.payload?.chipGroups ?? []

      groups.forEach((g: any) => {
        const key = g.color
        const count = g.count ?? 0

        // 这里先用一个简单规则：
        // count >= 10 当作「整堆」，否则「拆分」
        if (count >= 10) {
          full.set(key, (full.get(key) ?? 0) + 1)
        } else {
          split.set(key, (split.get(key) ?? 0) + 1)
        }
      })
    })

    const labels = Array.from(new Set([...full.keys(), ...split.keys()]))

    return {
      labels,
      fullStack: labels.map((l) => full.get(l) ?? 0),
      splitStack: labels.map((l) => split.get(l) ?? 0),
    }
  })

  const answerDiff = computed(() => {
    const points: Array<[number, number]> = []

    wrongCases.value.forEach((wc) => {
      const correct = wc.payload?.correctValue
      const user = wc.payload?.userAnswer

      if (typeof correct === 'number' && typeof user === 'number') {
        points.push([correct, user])
      }
    })

    return {
      points,
    }
  })

  return {
    loading,
    error,
    sessions,
    wrongCases,
    summary,
    daily,
    accuracyTrend,
    chipStructure,
    answerDiff,
  }
}
