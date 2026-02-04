// functions/src/index.ts
import { onRequest } from 'firebase-functions/https'
import * as logger from 'firebase-functions/logger'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

initializeApp()
const db = getFirestore()

export const flushFallback = onRequest(async (req, res) => {
  try {
    // ✅ fallback：只接受 POST，其它一律快速结束
    if (req.method !== 'POST') {
      res.status(204).end()
      return
    }

    /**
     * ⚠️ sendBeacon 的关键点：
     * - req.body 可能是 string / Buffer / undefined
     * - 不能假设是 JSON
     */
    let payload: any = null

    try {
      if (typeof req.body === 'string') {
        payload = JSON.parse(req.body)
      } else if (Buffer.isBuffer(req.body)) {
        payload = JSON.parse(req.body.toString())
      } else if (typeof req.body === 'object') {
        payload = req.body
      }
    } catch {
      // JSON 解析失败 → 直接放弃（best-effort）
      logger.warn('[flushFallback] invalid body')
      res.status(204).end()
      return
    }

    const { activeSession, dailyStatsDelta, wrongDailyDelta } = payload || {}

    // ⚠️ fallback：只做“最低限度”判断
    if (
      !activeSession ||
      !activeSession.summary ||
      !activeSession.summary.sessionId ||
      !activeSession.summary.userId
    ) {
      res.status(204).end()
      return
    }
    // 🛡 后端保险：没有任何答题记录，直接放弃
    if (!Array.isArray(activeSession.answers) || activeSession.answers.length === 0) {
      logger.info('[flushFallback] skip empty session', {
        sessionId: activeSession?.summary?.sessionId,
        userId: activeSession?.summary?.userId,
      })
      res.status(204).end()
      return
    }

    const sessionId = activeSession.summary.sessionId
    const userId = activeSession.summary.userId
    const createdAt = new Date(activeSession.summary.createdAt)
    const date = createdAt.toISOString().slice(0, 10)

    const sessionRef = db.collection('user_sessions').doc(sessionId)

    // ✅ 幂等：session 已存在，说明正常 flush 过
    const exists = await sessionRef.get()
    if (exists.exists) {
      res.status(204).end()
      return
    }

    const batch = db.batch()

    /* ========================
     * 1️⃣ session + answers
     * ====================== */
    batch.set(sessionRef, {
      ...activeSession.summary,
      createdAt: FieldValue.serverTimestamp(),
    })

    const answersCol = sessionRef.collection('answers')
    for (const a of activeSession.answers ?? []) {
      batch.set(answersCol.doc(), {
        ...a,
        answeredAt: FieldValue.serverTimestamp(),
      })
    }

    /* ========================
     * 2️⃣ daily_stats（增量）
     * ====================== */
    if (dailyStatsDelta) {
      const dailyRef = db.collection('user_stats_daily').doc(`${userId}_${date}`)

      batch.set(
        dailyRef,
        {
          userId,
          date,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )

      const updates: any = {
        totalQuestions: FieldValue.increment(dailyStatsDelta.totalQuestions ?? 0),
        correctCount: FieldValue.increment(dailyStatsDelta.correctCount ?? 0),
        totalDurationMs: FieldValue.increment(dailyStatsDelta.totalDurationMs ?? 0),
        updatedAt: FieldValue.serverTimestamp(),
      }

      for (const mode in dailyStatsDelta.byMode ?? {}) {
        const m = dailyStatsDelta.byMode[mode]
        updates[`byMode.${mode}.questions`] = FieldValue.increment(m.questions ?? 0)
        updates[`byMode.${mode}.correct`] = FieldValue.increment(m.correct ?? 0)
        updates[`byMode.${mode}.wrong`] = FieldValue.increment(m.wrong ?? 0)
      }

      for (const sub in dailyStatsDelta.bySubMode ?? {}) {
        const s = dailyStatsDelta.bySubMode[sub]
        updates[`bySubMode.${sub}.questions`] = FieldValue.increment(s.questions ?? 0)
        updates[`bySubMode.${sub}.correct`] = FieldValue.increment(s.correct ?? 0)
        updates[`bySubMode.${sub}.wrong`] = FieldValue.increment(s.wrong ?? 0)
      }

      batch.update(dailyRef, updates)
    }

    /* ========================
     * 3️⃣ wrong_daily（合并）
     * ====================== */
    if (wrongDailyDelta) {
      const wrongRef = db.collection('wrong_daily').doc(`${userId}_${date}`)
      const snap = await wrongRef.get()

      if (!snap.exists) {
        batch.set(wrongRef, {
          userId,
          date,
          totalWrong: wrongDailyDelta.totalWrong ?? 0,
          byMode: wrongDailyDelta.byMode ?? {},
          bySubMode: wrongDailyDelta.bySubMode ?? {},
          sessionIds: [wrongDailyDelta.sessionId],
          updatedAt: Date.now(),
        })
      } else {
        const prev = snap.data() || {}

        const mergedByMode = { ...(prev.byMode ?? {}) }
        for (const k in wrongDailyDelta.byMode ?? {}) {
          mergedByMode[k] = (mergedByMode[k] ?? 0) + wrongDailyDelta.byMode[k]
        }

        const mergedBySubMode = { ...(prev.bySubMode ?? {}) }
        for (const k in wrongDailyDelta.bySubMode ?? {}) {
          mergedBySubMode[k] = (mergedBySubMode[k] ?? 0) + wrongDailyDelta.bySubMode[k]
        }

        const mergedSessionIds = Array.from(
          new Set([...(prev.sessionIds ?? []), wrongDailyDelta.sessionId])
        )

        batch.update(wrongRef, {
          totalWrong: (prev.totalWrong ?? 0) + (wrongDailyDelta.totalWrong ?? 0),
          byMode: mergedByMode,
          bySubMode: mergedBySubMode,
          sessionIds: mergedSessionIds,
          updatedAt: Date.now(),
        })
      }
    }

    await batch.commit()

    // ✅ fallback 永远成功返回
    res.status(204).end()
  } catch (e) {
    logger.error('[flushFallback] fatal error', e)
    // ⚠️ fallback：即使异常，也不能返回错误
    res.status(204).end()
  }
})
