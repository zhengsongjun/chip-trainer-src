import { ref } from 'vue'
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore'
import { db } from '@/firebase'
import type { WrongDailyDoc } from '@/trainerCount/types/WrongDaily.types'

/* ================= Types ================= */

export type WrongBookRow = {
  date: string

  chipCount: number
  chipSubModes: {
    cash: number
    tournament: number
  }

  boardAnalysisCount: number
  boardAnalysisSubModes: {
    holdem: number
    omaha: number
    bigo: number
    '7stud': number
    razz: number
    badugi: number
  }
}

type FetchResult = {
  rows: WrongBookRow[]
  lastDoc: QueryDocumentSnapshot<DocumentData> | null
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
      return { rows: [], lastDoc: null }
    }

    loading.value = true

    try {
      const constraints: any[] = [
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc'),
        limit(pageSize),
      ]

      if (cursor) {
        constraints.push(startAfter(cursor))
      }

      const snap = await getDocs(query(collection(db, 'wrong_daily'), ...constraints))

      const rows: WrongBookRow[] = []

      for (const doc of snap.docs) {
        const d = doc.data() as WrongDailyDoc

        rows.push({
          date: d.date,

          chipCount: d.byMode?.chip ?? 0,
          chipSubModes: {
            cash: d.bySubMode?.cash ?? 0,
            tournament: d.bySubMode?.tournament ?? 0,
          },

          boardAnalysisCount: d.byMode?.['board-analysis'] ?? 0,
          boardAnalysisSubModes: {
            holdem: d.bySubMode?.holdem ?? 0,
            omaha: d.bySubMode?.omaha ?? 0,
            bigo: d.bySubMode?.bigo ?? 0,
            '7stud': d.bySubMode?.['7stud'] ?? 0,
            razz: d.bySubMode?.razz ?? 0,
            badugi: d.bySubMode?.badugi ?? 0,
          },
        })
      }

      return {
        rows,
        lastDoc: snap.docs.at(-1) ?? null,
      }
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    fetchWrongBookRows,
  }
}
