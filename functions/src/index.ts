import { setGlobalOptions } from 'firebase-functions'
import { onRequest } from 'firebase-functions/https'
import * as logger from 'firebase-functions/logger'

import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// ⭐ 初始化 admin（只需要一次）
initializeApp()
const db = getFirestore()

setGlobalOptions({ maxInstances: 10 })

export const flushSession = onRequest(async (req, res) => {
  try {
    logger.info('[flushSession] received')
    logger.info('[flushSession] body', req.body)

    // ⭐ 最小写库：直接存一份 payload
    const ref = await db.collection('beacon_sessions').add({
      payload: req.body,
      createdAt: Date.now(),
    })

    logger.info('[flushSession] saved', { id: ref.id })

    res.json({ ok: true, id: ref.id })
  } catch (err) {
    logger.error('[flushSession] failed', err)
    res.status(500).json({ ok: false })
  }
})
