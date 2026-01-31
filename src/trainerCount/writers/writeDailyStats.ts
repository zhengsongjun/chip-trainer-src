import { doc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase'
import type { TrainingDailyStats } from '../types/trainingCount.types'

export async function writeDailyStats<Mode extends string, SubMode extends string>(
  userId: string,
  date: string,
  delta: Omit<TrainingDailyStats<Mode, SubMode>, 'userId' | 'date' | 'updatedAt'>
) {
  const ref = doc(db, 'user_stats_daily', `${userId}_${date}`)

  // 1️⃣ 确保文档存在
  await setDoc(
    ref,
    {
      userId,
      date,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )

  // 2️⃣ 累加
  const updates: any = {
    totalQuestions: increment(delta.totalQuestions),
    correctCount: increment(delta.correctCount),
    totalDurationMs: increment(delta.totalDurationMs),
    updatedAt: serverTimestamp(),
  }

  // byMode
  for (const mode in delta.byMode) {
    const m = delta.byMode[mode]
    updates[`byMode.${mode}.questions`] = increment(m.questions)
    updates[`byMode.${mode}.correct`] = increment(m.correct)
    updates[`byMode.${mode}.wrong`] = increment(m.wrong)
  }

  // bySubMode
  for (const sub in delta.bySubMode) {
    const s = delta.bySubMode[sub]
    updates[`bySubMode.${sub}.questions`] = increment(s.questions)
    updates[`bySubMode.${sub}.correct`] = increment(s.correct)
    updates[`bySubMode.${sub}.wrong`] = increment(s.wrong)
  }

  await updateDoc(ref, updates)
}
