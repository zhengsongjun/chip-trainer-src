import { updateSessionContext } from './session/session.update'
import type { SessionContext } from './session/session.context'
import { SessionManager } from './session/session.manager'
import { FirestoreSessionPersister } from './storage/firestore.session'
import { finalizeSession } from './session/session.finalize'
const DISABLE_ALL_REQUESTS = true
// ===== 全局单例 =====
let currentSession: SessionContext | null = null
let sessionManager: SessionManager | null = null

// ⭐ Beacon 兜底只发一次
let beaconFlushed = false

export function initSession(context: SessionContext) {
  currentSession = context
  beaconFlushed = false

  sessionManager = new SessionManager(context, new FirestoreSessionPersister(), {
    maxDurationMs: Infinity,
    idleTimeoutMs: Infinity,
  })
}

/**
 * 每答完一题调用
 */
export async function update(payload: Parameters<typeof updateSessionContext>[1]) {
  if (!currentSession || !sessionManager) return

  // 1️⃣ 只更新 context
  updateSessionContext(currentSession, payload)

  // 2️⃣ 通知 SessionManager（你原本就有）
  await sessionManager.afterAnswer()
}

export function addDetail(detail: unknown) {
  if (!currentSession) return
  currentSession.details.push(detail)
  console.log('[debug:addDetail] details.length =', currentSession.details.length)
}

/**
 * Beacon 兜底 flush
 * - 只发一次
 * - 发完清空 session
 * - 不 await，不阻塞
 */
export function beaconFlush() {
  if (DISABLE_ALL_REQUESTS) return
  if (!currentSession) return
  if (beaconFlushed) return
  if (currentSession.totalCount === 0) return
  if (currentSession.state !== 'active') return

  beaconFlushed = true

  const session = finalizeSession(currentSession, true)
  if (!session) return

  navigator.sendBeacon(
    '/__/functions/flushSession',
    JSON.stringify({
      session,
      wrongCases: currentSession.details,
    })
  )

  // ⭐ 发完立刻清空（符合你的需求）
  cleanupSession()
}

/**
 * 全局 Beacon 兜底注册
 * （你原本就有，不动）
 */
export function setupBeaconGuard() {
  window.addEventListener('pagehide', () => {
    beaconFlush()
  })

  window.addEventListener('beforeunload', () => {
    beaconFlush()
  })
}

/**
 * 手动 flush（你原本就有，不动）
 */
export async function flush(isComplete: boolean) {
  if (DISABLE_ALL_REQUESTS) return
  if (!sessionManager || !currentSession) return
  if (currentSession.totalCount === 0) return

  await sessionManager.flush(isComplete)
}

/**
 * 你原本的 Beacon flush（不动）
 */
export function flushWithBeacon() {
  if (DISABLE_ALL_REQUESTS) return
  if (!currentSession || !sessionManager) return

  const session = finalizeSession(currentSession, true)
  if (!session) return

  navigator.sendBeacon('/__/functions/flushSession', JSON.stringify(session))
}

/**
 * ===== 仅新增：清空 session 的内部方法 =====
 * 不导出、不影响任何调用方
 */
function cleanupSession() {
  currentSession = null
  sessionManager = null
}
