import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/firebase'

export async function writeWrongPracticeDaily(params: {
  userId: string
  date: string
  byMode: Record<string, number>
  bySubMode: Record<string, number>
  total: number
}) {
  const { userId, date, byMode, bySubMode, total } = params

  const docId = `${userId}_${date}`
  const ref = doc(db, 'wrong_practice_daily', docId)

  const snap = await getDoc(ref)

  if (!snap.exists()) {
    // ✅ 首次写入
    await setDoc(ref, {
      userId,
      date,
      byMode,
      bySubMode,
      total,
      updatedAt: Date.now(),
    })
    return
  }

  // ✅ merge 累加
  const prev = snap.data()

  const nextByMode = { ...(prev.byMode || {}) }
  for (const key in byMode) {
    nextByMode[key] = (nextByMode[key] || 0) + byMode[key]
  }

  const nextBySubMode = { ...(prev.bySubMode || {}) }
  for (const key in bySubMode) {
    nextBySubMode[key] = (nextBySubMode[key] || 0) + bySubMode[key]
  }

  await setDoc(
    ref,
    {
      byMode: nextByMode,
      bySubMode: nextBySubMode,
      total: (prev.total || 0) + total,
      updatedAt: Date.now(),
    },
    { merge: true }
  )
}
