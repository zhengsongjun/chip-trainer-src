import type { CashColor } from '../customHooks/useCashGame'
import { TournamentColor } from '../utils/tournamentConfig'
import { CASH_PRESET_LABELS } from './cashPresetLabels'
import { TOURNAMENT_PRESETS, TournamentPresetKey } from './tournamentPresets'
import type { PresetOption } from './types'

export type CashPresetKey =
  | 'none'
  | 'red_rock_1_3'
  | 'red_rock_5_5'
  | 'wynn_1_3'
  | 'red_rock_bank'
  | 'wynn_bank'
  | 'wsop_bank'
  | 'bellagio_bank'
  | 'bellagio_1_3'
  | 'bellagio_2_5'
  | 'wynn_2_5'

export interface CashPreset {
  /** 使用的筹码颜色 */
  colors?: CashColor[]

  /** 最大数量 */
  limits: Record<CashColor, number>

  /** 最小数量 */
  minLimits: Record<CashColor, number>
}

export const CASH_PRESETS: Record<CashPresetKey, CashPreset> = {
  none: {
    // 无预设时不修改颜色选择，保持用户当前的选择
    limits: {
      white1: 100,
      pink2: 100,
      brown3: 100,
      red5: 100,
      green25: 100,
      black100: 100,
      purple500: 100,
      yellow1k: 20,
      red5k: 20,
      green25k: 20,
    },
    minLimits: {
      white1: 0,
      pink2: 0,
      brown3: 0,
      red5: 0,
      green25: 0,
      black100: 0,
      purple500: 0,
      yellow1k: 0,
      red5k: 0,
      green25k: 0,
    },
  },
  red_rock_1_3: {
    colors: ['white1', 'pink2', 'red5', 'green25'],
    limits: {
      white1: 40,
      pink2: 20,
      brown3: 0,
      red5: 200,
      green25: 60,
      black100: 0,
      purple500: 0,
      yellow1k: 0,
      red5k: 0,
      green25k: 0,
    },
    minLimits: {
      white1: 0,
      pink2: 0,
      brown3: 0,
      red5: 0,
      green25: 0,
      black100: 0,
      purple500: 0,
      yellow1k: 0,
      red5k: 0,
      green25k: 0,
    },
  },
  red_rock_5_5: {
    colors: ['red5', 'green25', 'black100'],
    limits: {
      white1: 0,
      pink2: 0,
      brown3: 0,
      red5: 100,
      green25: 80,
      black100: 80,
      purple500: 0,
      yellow1k: 0,
      red5k: 0,
      green25k: 0,
    },
    minLimits: {
      white1: 0,
      pink2: 0,
      brown3: 0,
      red5: 0,
      green25: 0,
      black100: 0,
      purple500: 0,
      yellow1k: 0,
      red5k: 0,
      green25k: 0,
    },
  },
  wynn_1_3: {
    colors: ['white1', 'red5', 'green25', 'black100'],
    limits: {
      white1: 40,
      pink2: 0,
      brown3: 0,
      red5: 200,
      green25: 40,
      black100: 20,
      purple500: 0,
      yellow1k: 0,
      red5k: 0,
      green25k: 0,
    },
    minLimits: {
      white1: 0,
      pink2: 0,
      brown3: 0,
      red5: 0,
      green25: 0,
      black100: 0,
      purple500: 0,
      yellow1k: 0,
      red5k: 0,
      green25k: 0,
    },
  },
  red_rock_bank: {
    colors: ['white1', 'pink2', 'red5'],
    limits: {
      white1: 300,
      pink2: 300,
      brown3: 0,
      red5: 60,
      green25: 0,
      black100: 0,
      purple500: 0,
      yellow1k: 0,
      red5k: 0,
      green25k: 0,
    },
    minLimits: {
      white1: 20,
      pink2: 20,
      brown3: 0,
      red5: 1,
      green25: 0,
      black100: 0,
      purple500: 0,
      yellow1k: 0,
      red5k: 0,
      green25k: 0,
    },
  },
  wynn_bank: {
    colors: ['white1', 'pink2', 'red5', 'black100'],
    limits: {
      white1: 200,
      pink2: 70,
      brown3: 0,
      red5: 60,
      green25: 0,
      black100: 12,
      purple500: 0,
      yellow1k: 0,
      red5k: 0,
      green25k: 0,
    },
    minLimits: {
      white1: 10,
      pink2: 5,
      brown3: 0,
      red5: 2,
      green25: 0,
      black100: 0,
      purple500: 0,
      yellow1k: 0,
      red5k: 0,
      green25k: 0,
    },
  },
  wsop_bank: {
    colors: ['white1', 'pink2', 'red5'],
    limits: {
      white1: 200,
      pink2: 100,
      brown3: 0,
      red5: 25,
      green25: 0,
      black100: 0,
      purple500: 0,
      yellow1k: 0,
      red5k: 0,
      green25k: 0,
    },
    minLimits: {
      white1: 20,
      pink2: 5,
      brown3: 0,
      red5: 1,
      green25: 0,
      black100: 0,
      purple500: 0,
      yellow1k: 0,
      red5k: 0,
      green25k: 0,
    },
  },
  bellagio_bank: {
    colors: ['white1', 'brown3', 'red5', 'black100'],
    limits: {
      white1: 200,
      pink2: 0,
      brown3: 70,
      red5: 50,
      green25: 0,
      black100: 15,
      purple500: 0,
      yellow1k: 0,
      red5k: 0,
      green25k: 0,
    },
    minLimits: {
      white1: 15,
      pink2: 0,
      brown3: 5,
      red5: 5,
      green25: 0,
      black100: 1,
      purple500: 0,
      yellow1k: 0,
      red5k: 0,
      green25k: 0,
    },
  },
  bellagio_1_3: {
    colors: ['white1', 'brown3', 'red5', 'green25', 'black100'],
    limits: {
      white1: 25,
      pink2: 0,
      brown3: 10,
      red5: 120,
      green25: 40,
      black100: 10,
      purple500: 0,
      yellow1k: 0,
      red5k: 0,
      green25k: 0,
    },
    minLimits: {
      white1: 5,
      pink2: 0,
      brown3: 0,
      red5: 10,
      green25: 0,
      black100: 0,
      purple500: 0,
      yellow1k: 0,
      red5k: 0,
      green25k: 0,
    },
  },
  bellagio_2_5: {
    colors: ['white1', 'brown3', 'red5', 'green25', 'black100', 'purple500'],
    limits: {
      white1: 15,
      pink2: 0,
      brown3: 10,
      red5: 120,
      green25: 40,
      black100: 10,
      purple500: 5,
      yellow1k: 0,
      red5k: 0,
      green25k: 0,
    },
    minLimits: {
      white1: 5,
      pink2: 0,
      brown3: 0,
      red5: 10,
      green25: 0,
      black100: 0,
      purple500: 0,
      yellow1k: 0,
      red5k: 0,
      green25k: 0,
    },
  },
  wynn_2_5: {
    colors: ['white1', 'red5', 'green25', 'black100', 'purple500'],
    limits: {
      white1: 35,
      pink2: 0,
      brown3: 0,
      red5: 120,
      green25: 40,
      black100: 10,
      purple500: 5,
      yellow1k: 0,
      red5k: 0,
      green25k: 0,
    },
    minLimits: {
      white1: 0,
      pink2: 0,
      brown3: 0,
      red5: 10,
      green25: 0,
      black100: 0,
      purple500: 0,
      yellow1k: 0,
      red5k: 0,
      green25k: 0,
    },
  },
}

export function getCashPresetOptions(): PresetOption<CashPresetKey>[] {
  return Object.keys(CASH_PRESET_LABELS).map((key) => ({
    value: key as CashPresetKey,
    label: CASH_PRESET_LABELS[key as CashPresetKey],
  }))
}

export function createCashColorChecker(presetKey: CashPresetKey) {
  const preset = CASH_PRESETS[presetKey]

  // none 或非法 preset：默认全部可用
  if (!preset || !preset.colors || preset.colors.length === 0) {
    return (_color: CashColor) => true
  }

  const enabledSet = new Set<CashColor>(preset.colors)

  return (color: CashColor): boolean => {
    return enabledSet.has(color)
  }
}

export function createTournamentColorChecker(presetKey: TournamentPresetKey) {
  // 无预设：全部允许
  if (presetKey === 'none') {
    return (_color: TournamentColor) => true
  }

  const preset = TOURNAMENT_PRESETS[presetKey]

  // 没定义 preset 或没 colors：全部允许
  if (!preset || !preset.colors || preset.colors.length === 0) {
    return (_color: TournamentColor) => true
  }

  const enabledSet = new Set<TournamentColor>(preset.colors)

  return (color: TournamentColor): boolean => {
    return enabledSet.has(color)
  }
}
