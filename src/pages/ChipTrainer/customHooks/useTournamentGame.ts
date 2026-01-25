import { splitTournamentStacks } from '../utils/chipUtils'
import { TOURNAMENT_CHIPS, TournamentColor } from '../utils/tournamentConfig'

/**
 * 锦标赛筹码上限配置
 * ⚠️ key 保持与你 index.vue 完全一致（不改）
 */
export interface TournamentChipLimits {
  green25: number
  black100: number
  purple500: number
  gold1000: number
  red5000: number
  // ===== 新增（你已经在 index.vue 里用到的）=====
  grey5m: number
  orange1m: number
  blue100k: number
}

/**
 * Tournament Game Config
 */
export interface TournamentGameConfig {
  colors: TournamentColor[]
  limits: TournamentChipLimits
}

export function useTournamentGame(config: TournamentGameConfig) {
  function randomCount(max: number) {
    if (!Number.isFinite(max) || max <= 0) return 0
    return Math.floor(Math.random() * (max + 1))
  }

  function generate() {
    const groups: { color: TournamentColor; count: number }[] = []
    let total = 0

    // 兜底：配置不存在直接返回
    if (!config || !Array.isArray(config.colors) || !config.limits) {
      return { groups, total: 0 }
    }

    // 展示顺序：大面额 → 小面额
    const ORDER: TournamentColor[] = [
      'grey5m',
      'orange1m',
      'blue100k',
      'red5k',
      'yellow1k',
      'purple500',
      'black100',
      'green25k',
    ]

    for (const color of ORDER) {
      // 未启用的颜色直接跳过
      if (!config.colors.includes(color)) continue

      const def = TOURNAMENT_CHIPS[color]
      if (!def || !Number.isFinite(def.value)) continue

      const max = config.limits[color]
      if (!Number.isFinite(max) || max <= 0) continue

      const count = Math.floor(Math.random() * (max + 1))
      if (!Number.isFinite(count) || count <= 0) continue

      // === 拆堆（再兜一层） ===
      let stacks: number[] = []
      try {
        stacks = splitTournamentStacks(count, def.smallGroup)
      } catch {
        stacks = [count]
      }

      for (const c of stacks) {
        if (!Number.isFinite(c) || c <= 0) continue
        groups.push({ color, count: c })
      }

      // === total 累加（绝对不 NaN） ===
      const add = count * def.value
      if (Number.isFinite(add)) {
        total += add
      }
    }

    // 最终兜底：保证 UI 永远不是 NaN
    if (!Number.isFinite(total)) {
      total = 0
    }

    return { groups, total }
  }

  return { generate }
}
