import { resetSessionContext, type SessionContext } from './session.context'
import type { SessionPersister } from '../storage/persist.session'
import { finalizeSession } from './session.finalize'
import { FirestoreWrongCasePersister } from '../storage/firestore.wrongCase'

export class SessionManager {
  private detailPersisters = [new FirestoreWrongCasePersister()]
  private flushing = false
  constructor(
    private context: SessionContext,
    private persister: SessionPersister,
    private options: {
      maxDurationMs: number
      idleTimeoutMs: number
    }
  ) {}

  async afterAnswer(): Promise<void> {
    if (this.context.state !== 'active') return
    if (this.context.totalCount === 0) return

    if (this.context.totalCount % 10 !== 0) return

    await this.flush(true)
  }

  async flush(force: boolean): Promise<void> {
    if (this.flushing) return
    this.flushing = true

    try {
      if (this.context.state !== 'active') return
      if (this.context.totalCount === 0) return
      if (!force && this.context.totalCount % 10 !== 0) return

      const stats = finalizeSession(this.context, force)
      if (!stats) return

      const trainingStatsId = await this.persister.save(stats)

      for (const persister of this.detailPersisters) {
        await persister.save(trainingStatsId, [...this.context.details])
      }

      resetSessionContext(this.context)
    } finally {
      this.flushing = false
    }
  }
}
