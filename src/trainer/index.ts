import { updateSessionContext } from './session/session.update'
import type { SessionContext } from './session/session.context'
import { SessionManager } from './session/session.manager'
import { FirestoreSessionPersister } from './storage/firestore.session'
import { finalizeSession } from './session/session.finalize'

// ===== 全局单例 =====
let currentSession: SessionContext | null = null
let sessionManager: SessionManager | null = null

export function initSession(context: SessionContext) {
  currentSession = context

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

  // 2️⃣ 只通知 SessionManager
  // 是否 split / flush，由它内部决定
  await sessionManager.afterAnswer()
}

export function addDetail(detail: unknown) {
  if (!currentSession) return
  currentSession.details.push(detail)
  console.log('[debug:addDetail] details.length =', currentSession.details.length)
}

/**
 * Beacon 兜底 flush
 * 不修改内存状态，不 await
 */
export function beaconFlush() {
  if (!currentSession) return
  if (currentSession.totalCount === 0) return
  if (currentSession.state !== 'active') return

  const session = finalizeSession(currentSession, true)
  if (!session) return

  navigator.sendBeacon(
    '/beacon/training-stats',
    JSON.stringify({
      session,
      wrongCases: currentSession.details,
    })
  )
}

/**
 * 全局 Beacon 兜底注册
 * 只需要调用一次
 */
export function setupBeaconGuard() {
  // 使用 pagehide（比 beforeunload 更可靠）
  window.addEventListener('pagehide', () => {
    beaconFlush()
  })

  // 兜底（部分浏览器）
  window.addEventListener('beforeunload', () => {
    beaconFlush()
  })
}

export async function flush(isComplete: boolean) {
  if (!sessionManager || !currentSession) return
  if (currentSession.totalCount === 0) return

  await sessionManager.flush(isComplete)
}

export function flushWithBeacon() {
  if (!currentSession || !sessionManager) return

  const session = finalizeSession(currentSession, true)
  if (!session) return

  navigator.sendBeacon('/api/training/session', JSON.stringify(session))
}
