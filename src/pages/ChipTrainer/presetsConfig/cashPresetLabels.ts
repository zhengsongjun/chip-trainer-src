import type { CashPresetKey } from './cashPresets'

export const CASH_PRESET_LABELS: Record<CashPresetKey, string> = {
  none: '无预设',

  red_rock_1_3: '1/3 NLH Red Rock',
  red_rock_5_5: '5/5 NLH Red Rock',

  wynn_1_3: '1/3 NLH Wynn',
  wynn_2_5: '2/5 NLH Wynn',

  bellagio_1_3: '1/3 NLH Bellagio',
  bellagio_2_5: '2/5 NLH Bellagio',

  red_rock_bank: 'Red Rock Bank',
  wynn_bank: 'Wynn Bank',
  wsop_bank: 'WSOP Bank',
  bellagio_bank: 'Bellagio Bank',
}
