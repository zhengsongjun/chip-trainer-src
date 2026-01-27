import type { Session } from '../session/session.types'

/**
 * Session 持久化接口
 * 用来约束“Session 怎么被存”
 */
export interface SessionPersister {
  save(session: Session): Promise<string>
  saveByBeacon?(session: Session): void
}
