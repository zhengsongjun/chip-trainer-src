import { SessionContext } from './session.types'

interface ShouldSplitOptions {
  batchSize: number
  force?: boolean
}

export function shouldSplitSession(
  context: SessionContext,
  options: ShouldSplitOptions,
): boolean {
  if (options.force) return true

  if (context.totalCount === 0) return false

  // ⭐️ 核心：10 题一发
  if (context.totalCount % options.batchSize === 0) {
    return true
  }

  return false
}

