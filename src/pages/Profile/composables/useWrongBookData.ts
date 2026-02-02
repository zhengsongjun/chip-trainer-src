import { ref } from 'vue'
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
  limit,
  startAfter,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore'
import { db } from '@/firebase'

/* ================= Types ================= */

export type WrongBookRow = {
  date: string
  chipCount: number
  chipSubModes: {
    cash: number
    tournament: number
  }
  cardCount: number
}

export type WrongAnswer = {
  id: string
  sessionId: string
  mode: 'chip' | 'card'
  subMode: string
  payload: any
  answeredAt: number
}

type FetchResult = {
  rows: WrongBookRow[]
  answersByDate: Record<string, WrongAnswer[]>
  lastDoc: QueryDocumentSnapshot<DocumentData> | null
}

/* ================= Utils ================= */

function formatDate(ts: Timestamp) {
  const d = ts.toDate()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/* ================= Hook ================= */

export function useWrongBook() {
  const loading = ref(false)

  async function fetchWrongBookRows(params: {
    userId: string
    pageSize: number
    cursor?: QueryDocumentSnapshot<DocumentData> | null
  }): Promise<FetchResult> {
    const { userId, pageSize, cursor } = params
    if (!userId) {
      return { rows: [], answersByDate: {}, lastDoc: null }
    }

    loading.value = true

    try {
      const constraints: any[] = [
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(pageSize),
      ]
      if (cursor) constraints.push(startAfter(cursor))

      const sessionSnap = await getDocs(query(collection(db, 'user_sessions'), ...constraints))

      const dateMap = new Map<string, WrongBookRow>()
      const answersByDate: Record<string, WrongAnswer[]> = {}

      for (const sessionDoc of sessionSnap.docs) {
        const session = sessionDoc.data()
        if (!session.createdAt) continue

        const date = formatDate(session.createdAt)
        const mode = session.mode

        if (!dateMap.has(date)) {
          dateMap.set(date, {
            date,
            chipCount: 0,
            chipSubModes: { cash: 0, tournament: 0 },
            cardCount: 0,
          })
        }

        if (!answersByDate[date]) {
          answersByDate[date] = []
        }

        const answersSnap = await getDocs(
          query(
            collection(db, 'user_sessions', sessionDoc.id, 'answers'),
            where('isCorrect', '==', false)
          )
        )

        for (const doc of answersSnap.docs) {
          const a = doc.data()

          // 保存完整 answer（练习用）
          answersByDate[date].push({
            id: doc.id,
            sessionId: sessionDoc.id,
            mode,
            subMode: a.subMode,
            payload: a.payload,
            answeredAt: a.answeredAt?.toMillis ? a.answeredAt.toMillis() : a.answeredAt,
          })

          // 表格统计
          if (mode === 'chip') {
            const row = dateMap.get(date)!
            row.chipCount++
            if (a.subMode === 'cash') row.chipSubModes.cash++
            if (a.subMode === 'tournament') row.chipSubModes.tournament++
          }
        }
      }

      return {
        rows: Array.from(dateMap.values()),
        answersByDate,
        lastDoc: sessionSnap.docs.at(-1) ?? null,
      }
    } finally {
      loading.value = false
    }
  }

  return { loading, fetchWrongBookRows }
}
