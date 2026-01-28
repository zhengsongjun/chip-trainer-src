import type { TournamentColor } from '../utils/tournamentConfig'
import { TOURNAMENT_PRESET_LABELS } from './tournamentPresetLabels'
import { PresetOption } from './types'

export type TournamentPresetKey =
  | 'none'
  | 'day1_early'
  | 'day1_first_color_up'
  | 'day1_second_color_up'
  | 'day2_first_color_up'
  | 'day2_second_color_up'
  | 'final_table'

export interface TournamentPreset {
  colors?: TournamentColor[]
  limits: Record<TournamentColor, number>
}

export const TOURNAMENT_PRESETS: Record<TournamentPresetKey, TournamentPreset> = {
  none: {
    // 无预设时不修改颜色选择，保持用户当前的选择
    limits: {
      green25k: 60,
      black100: 100,
      purple500: 100,
      yellow1k: 100,
      red5k: 100,
      blue100k: 40,
      pink500k: 20,
      orange1m: 20,
      grey5m: 20,
    },
  },
  day1_early: {
    colors: ['black100', 'purple500', 'yellow1k', 'red5k', 'green25k'],
    limits: {
      green25k: 40,
      black100: 60,
      purple500: 40,
      yellow1k: 40,
      red5k: 40,
      blue100k: 0,
      pink500k: 0,
      orange1m: 0,
      grey5m: 0,
    },
  },
  day1_first_color_up: {
    colors: ['purple500', 'yellow1k', 'red5k', 'green25k', 'blue100k'],
    limits: {
      green25k: 25,
      black100: 0,
      purple500: 40,
      yellow1k: 40,
      red5k: 40,
      blue100k: 15,
      pink500k: 0,
      orange1m: 0,
      grey5m: 0,
    },
  },
  day1_second_color_up: {
    colors: ['yellow1k', 'red5k', 'green25k', 'blue100k'],
    limits: {
      green25k: 40,
      black100: 0,
      purple500: 0,
      yellow1k: 40,
      red5k: 60,
      blue100k: 40,
      pink500k: 0,
      orange1m: 0,
      grey5m: 0,
    },
  },
  day2_first_color_up: {
    colors: ['red5k', 'green25k', 'blue100k', 'pink500k'],
    limits: {
      green25k: 40,
      black100: 0,
      purple500: 0,
      yellow1k: 0,
      red5k: 60,
      blue100k: 60,
      pink500k: 40,
      orange1m: 0,
      grey5m: 0,
    },
  },
  day2_second_color_up: {
    colors: ['green25k', 'blue100k', 'pink500k', 'orange1m'],
    limits: {
      green25k: 60,
      black100: 0,
      purple500: 0,
      yellow1k: 0,
      red5k: 0,
      blue100k: 60,
      pink500k: 60,
      orange1m: 20,
      grey5m: 0,
    },
  },
  final_table: {
    colors: ['blue100k', 'pink500k', 'orange1m', 'grey5m'],
    limits: {
      green25k: 0,
      black100: 0,
      purple500: 0,
      yellow1k: 0,
      red5k: 0,
      blue100k: 40,
      pink500k: 60,
      orange1m: 40,
      grey5m: 20,
    },
  },
}

export function getTournamentPresetOptions(): PresetOption<TournamentPresetKey>[] {
  return Object.keys(TOURNAMENT_PRESET_LABELS).map((key) => ({
    value: key as TournamentPresetKey,
    label: TOURNAMENT_PRESET_LABELS[key as TournamentPresetKey],
  }))
}

export function createTournamentColorChecker(presetKey: TournamentPresetKey) {
  const preset = TOURNAMENT_PRESETS[presetKey]
  if (presetKey === 'none') {
    return (_color: TournamentColor) => true
  }
  // none 或无 colors：默认全部可用
  if (!preset || !preset.colors || preset.colors.length === 0) {
    return (_color: TournamentColor) => true
  }

  const enabledSet = new Set<TournamentColor>(preset.colors)

  return (color: TournamentColor): boolean => {
    return enabledSet.has(color)
  }
}
