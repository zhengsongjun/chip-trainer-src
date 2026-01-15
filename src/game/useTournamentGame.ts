import { splitTournamentStacks } from './chipUtils'
import { TOURNAMENT_CHIPS, TournamentColor } from './tournamentConfig';

/**
 * Tournament Game Config
 */
export interface TournamentGameConfig {
  colors: TournamentColor[]
}


export function useTournamentGame(config: TournamentGameConfig) {
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

      // ✅ 所有颜色统一规则
      const count = Math.floor(Math.random() * 60) + 1

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

