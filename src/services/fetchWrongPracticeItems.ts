// src/services/wrongPractice.ts
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/firebase'

export type WrongAnswer = {
  id: string
  sessionId: string
  mode: 'chip' | 'board-analysis'
  subMode: string
  payload: any
  answeredAt: number
}

export async function fetchWrongPracticeItems(params: {
  userId: string
  dates: string[]
  subModes: Record<string, boolean>
}): Promise<WrongAnswer[]> {
  const { userId, dates, subModes } = params
  const result: WrongAnswer[] = []

  for (const date of dates) {
    // 1️⃣ 直接读 wrong_daily
    const dailyId = `${userId}_${date}`
    const dailySnap = await getDoc(doc(db, 'wrong_daily', dailyId))

    if (!dailySnap.exists()) continue

    const daily = dailySnap.data()
    const sessionIds: string[] = daily.sessionIds || []

    // 2️⃣ 循环 sessionIds，查 answers 子集合
    for (const sessionId of sessionIds) {
      const answersSnap = await getDocs(
        query(
          collection(db, 'user_sessions', sessionId, 'answers'),
          where('isCorrect', '==', false)
        )
      )

      for (const answerDoc of answersSnap.docs) {
        const a = answerDoc.data()

        // 3️⃣ subMode 过滤（来自弹窗）
        if (!subModes[a.subMode]) continue

        result.push({
          id: answerDoc.id,
          sessionId,
          mode: a.mode,
          subMode: a.subMode,
          payload: a.payload,
          answeredAt: a.answeredAt?.toMillis ? a.answeredAt.toMillis() : a.answeredAt,
        })
      }
    }
  }

  return result
}
