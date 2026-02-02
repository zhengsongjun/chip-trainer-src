import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase'
import type { WrongDailyDoc } from '../types/WrongDaily.types'

/**
 * 写入 / 合并每日错题统计（wrong_daily）
 *
 * 规则：
 * - 1 user + 1 date = 1 doc
 * - 不覆盖旧数据，只做累加
 * - 所有 number 字段都是“错题数”
 */
export async function writeWrongDaily<Mode extends string, SubMode extends string>(params: {
  userId: string
  date: string // YYYY-MM-DD
  delta: Omit<WrongDailyDoc<Mode, SubMode>, 'userId' | 'date'>
}) {
  const { userId, date, delta } = params

  const docId = `${userId}_${date}`
  const ref = doc(db, 'wrong_daily', docId)

  const snap = await getDoc(ref)

  // === 新建 ===
  if (!snap.exists()) {
    const newDoc: WrongDailyDoc<Mode, SubMode> = {
      userId,
      date,
      totalWrong: delta.totalWrong,
      byMode: delta.byMode,
      bySubMode: delta.bySubMode,
      sessionIds: delta.sessionIds,
      updatedAt: Date.now(),
    }

    await setDoc(ref, newDoc)
    return
  }

  // === merge ===
  const prev = snap.data() as WrongDailyDoc<Mode, SubMode>

  const mergedByMode: Record<string, number> = { ...prev.byMode }
  for (const key in delta.byMode) {
    mergedByMode[key] = (mergedByMode[key] ?? 0) + delta.byMode[key]
  }

  const mergedBySubMode: Record<string, number> = { ...prev.bySubMode }
  for (const key in delta.bySubMode) {
    mergedBySubMode[key] = (mergedBySubMode[key] ?? 0) + delta.bySubMode[key]
  }

  const mergedSessionIds = Array.from(
    new Set([...(prev.sessionIds ?? []), ...(delta.sessionIds ?? [])])
  )

  await updateDoc(ref, {
    totalWrong: (prev.totalWrong ?? 0) + delta.totalWrong,
    byMode: mergedByMode,
    bySubMode: mergedBySubMode,
    sessionIds: mergedSessionIds,
    updatedAt: Date.now(),
  })
}
