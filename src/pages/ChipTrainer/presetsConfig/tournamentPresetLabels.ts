import type { TournamentPresetKey } from './tournamentPresets'

/**
 * Tournament 预设展示文案
 * 👉 未来可以拆成 zh / en
 */
export const TOURNAMENT_PRESET_LABELS: Record<TournamentPresetKey, string> = {
  none: '无预设',

  day1_early: 'Day 1 Early',
  day1_first_color_up: 'Day 1 First Color Up',
  day1_second_color_up: 'Day 1 Second Color Up',

  day2_first_color_up: 'Day 2 First Color Up',
  day2_second_color_up: 'Day 2 Second Color Up',

  final_table: 'Final Table',
}
