import { CHIP_TYPES, splitWhiteStacks, splitRedStacks, splitGreenStacks } from '../utils/chipUtils'

/**
 * 现金桌颜色类型
 */
export type CashColor =
  | 'white1'
  | 'red5'
  | 'green25'
  | 'black100'
  | 'pink2'
  | 'purple500'
  | 'brown3'

/**
 * 单个筹码上限配置
 * key = 颜色语义（已与你给的最终规则对齐）
 */
export interface CashChipLimits {
  white1: number // 白色 1
  red5: number // 红色 5
  green25: number // 绿色 25
  pink2: number // 粉色 2
  black100: number // 黑色 100
  purple500: number // 紫色 500
  brown3: number // 棕色 3
}

/**
 * Cash Game Config
 */
export interface CashGameConfig {
  enabledColors: CashColor[]
  limits: CashChipLimits
}

/**
 * 现金赛出题引擎
 */
export function useCashGame(config: CashGameConfig) {
  function randomCount(max: number) {
    if (max <= 0) return 0
    return Math.floor(Math.random() * (max + 1))
  }

  function generate() {
    const groups: { color: CashColor; count: number }[] = []
    let total = 0

    const { enabledColors, limits } = config

    /* ================= 白色（1）================= */
    if (enabledColors.includes('white1')) {
      const count = randomCount(limits.white1)
      if (count > 0) {
        splitWhiteStacks(count).forEach((c) => {
          groups.push({ color: 'white1', count: c })
        })
        total += count * 1
      }
    }

    /* ================= 红色（5）================= */
    if (enabledColors.includes('red5')) {
      const count = randomCount(limits.red5)
      if (count > 0) {
        const choice = Math.random() < 0.5 ? 4 : 5
        splitRedStacks(count, choice).forEach((c) => {
          groups.push({ color: 'red5', count: c })
        })
        total += count * 5
      }
    }

    /* ================= 绿色（25）================ */
    if (enabledColors.includes('green25')) {
      const count = randomCount(limits.green25)
      if (count > 0) {
        splitGreenStacks(count).forEach((c) => {
          groups.push({ color: 'green25', count: c })
        })
        total += count * 25
      }
    }

    /* ================= 粉色（2）================ */
    if (enabledColors.includes('pink2')) {
      const count = randomCount(limits.pink2)
      if (count > 0) {
        splitWhiteStacks(count).forEach((c) => {
          groups.push({ color: 'pink2', count: c })
        })
        total += count * 2
      }
    }

    /* ================= 黑色（100）=============== */
    if (enabledColors.includes('black100')) {
      const count = randomCount(limits.black100)
      if (count > 0) {
        let remaining = count

        while (remaining > 20) {
          groups.push({ color: 'black100', count: 20 })
          remaining -= 20
        }

        if (remaining > 0) {
          groups.push({ color: 'black100', count: remaining })
        }

        total += count * 100
      }
    }

    /* ================= 紫色（500）=============== */
    if (enabledColors.includes('purple500')) {
      const count = randomCount(limits.purple500)
      if (count > 0) {
        splitWhiteStacks(count).forEach((c) => {
          groups.push({ color: 'purple500', count: c })
        })
        total += count * 500
      }
    }

    /* ================= 棕色（3）================ */
    if (enabledColors.includes('brown3')) {
      const count = randomCount(limits.brown3)
      if (count > 0) {
        splitWhiteStacks(count).forEach((c) => {
          groups.push({ color: 'brown3', count: c })
        })
        total += count * 3
      }
    }

    /* ================= 排序（大 → 小）================ */
    const ORDER: CashColor[] = [
      'purple500',
      'black100',
      'green25',
      'red5',
      'brown3',
      'pink2',
      'white1',
    ]
    groups.sort((a, b) => ORDER.indexOf(a.color) - ORDER.indexOf(b.color))

    return { groups, total }
  }

  return { generate }
}
