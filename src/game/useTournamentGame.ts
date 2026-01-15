import { splitTournamentStacks } from './chipUtils'
import { TOURNAMENT_CHIPS, TournamentColor } from './tournamentConfig';

/**
 * Tournament Game Config
 */
export interface TournamentGameConfig {
  colors: TournamentColor[]
  blackRange: '1-19' | '20-60'
}


export function useTournamentGame(config: TournamentGameConfig) {
  function generate() {
    const groups: { color: TournamentColor; count: number }[] = []
    let total = 0

    // ⭐ 权威顺序：从大面额 → 小面额
    const TOURNAMENT_ORDER: TournamentColor[] = [
      'green25k',
      'red5k',
      'yellow1k',
      'purple500',
      'black100',
    ]

    // ⭐ 关键：用这个 for，替换你原来的 for (const color of config.colors)
    for (const color of TOURNAMENT_ORDER) {
      // 如果用户没选这个颜色，直接跳过
      if (!config.colors.includes(color)) continue

      const def = TOURNAMENT_CHIPS[color]

      let count: number

      // 黑色使用二级区间规则
      if (color === 'black100') {
        count =
          config.blackRange === '1-19'
            ? Math.floor(Math.random() * 19) + 1
            : Math.floor(Math.random() * 41) + 20
      } else {
        // 其他颜色：通用随机区间
        count = Math.floor(Math.random() * 60) + 1
      }

      const stacks = splitTournamentStacks(count, def.smallGroup)

      stacks.forEach((c) => {
        groups.push({ color, count: c })
      })

      total += count * def.value
    }

    return {
      groups,
      total,
    }
  }

  return {
    generate,
  }
}

