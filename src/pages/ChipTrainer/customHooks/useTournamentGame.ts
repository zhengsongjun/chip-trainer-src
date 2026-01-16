import { splitTournamentStacks } from '../utils/chipUtils'
import { TOURNAMENT_CHIPS, TournamentColor } from '../utils/tournamentConfig'

/**
 * 锦标赛筹码上限配置
 * - 0 表示不生成该筹码
 * - UI 已限制最大 <= 1000，这里不重复校验
 */
export interface TournamentChipLimits {
  green25: number
  black100: number
  purple500: number
  gold1000: number
  red5000: number
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
    if (max <= 0) return 0
    return Math.floor(Math.random() * (max + 1))
  }

  function generate() {
    const groups: { color: TournamentColor; count: number }[] = []
    let total = 0

    const TOURNAMENT_ORDER: TournamentColor[] = [
      'green25k',
      'red5k',
      'yellow1k',
      'purple500',
      'black100',
    ]

    for (const color of TOURNAMENT_ORDER) {
      if (!config.colors.includes(color)) continue

      const def = TOURNAMENT_CHIPS[color]

      // 把 TournamentColor 映射到 limits 的 key
      const limitKey =
        color === 'green25k'
          ? 'green25'
          : color === 'black100'
            ? 'black100'
            : color === 'purple500'
              ? 'purple500'
              : color === 'yellow1k'
                ? 'gold1000'
                : 'red5000'

      const max = config.limits[limitKey]
      const count = randomCount(max)

      // 0：不生成
      if (count <= 0) continue

      const stacks = splitTournamentStacks(count, def.smallGroup)

      stacks.forEach((c) => {
        groups.push({ color, count: c })
      })

      total += count * def.value
    }

    return { groups, total }
  }

  return { generate }
}
