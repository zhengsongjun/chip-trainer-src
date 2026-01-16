import { CHIP_TYPES, splitRedStacks, splitGreenStacks, splitWhiteStacks } from './chipUtils'

/**
 * 现金桌颜色类型
 */
export type CashColor = 'white' | 'red' | 'green' | 'black'

/**
 * 单个筹码上限配置
 */
export interface CashChipLimits {
  white1: number
  red5: number
  green25: number
  black100: number
}
/**
 * Cash Game Config
 */
export interface CashGameConfig {
  enabledColors: CashColor[]
  limits: CashChipLimits
}

export function useCashGame(config: CashGameConfig) {
  function randomCount(max: number) {
    if (max <= 0) return 0
    return Math.floor(Math.random() * (max + 1))
  }

  function generate() {
    const groups: { color: CashColor; count: number }[] = []
    let total = 0

    const { enabledColors, limits } = config

    /* ========== 白色筹码（1）========== */
    if (enabledColors.includes('white')) {
      const whiteCount = randomCount(limits.white1)

      if (whiteCount > 0) {
        splitWhiteStacks(whiteCount).forEach((c) => {
          groups.push({ color: 'white', count: c })
        })

        total += whiteCount * CHIP_TYPES.white.value
      }
    }

    /* ========== 红色筹码（5）========== */
    if (enabledColors.includes('red')) {
      const redCount = randomCount(limits.red5)

      if (redCount > 0) {
        const choice = Math.random() < 0.5 ? 4 : 5

        splitRedStacks(redCount, choice).forEach((c) => {
          groups.push({ color: 'red', count: c })
        })

        total += redCount * CHIP_TYPES.red.value
      }
    }

    /* ========== 绿色筹码（25）========== */
    if (enabledColors.includes('green')) {
      const greenCount = randomCount(limits.green25)

      if (greenCount > 0) {
        splitGreenStacks(greenCount).forEach((c) => {
          groups.push({ color: 'green', count: c })
        })

        total += greenCount * CHIP_TYPES.green.value
      }
    }

    /* ========== 黑色筹码（100）========== */
    if (enabledColors.includes('black')) {
      const blackCount = randomCount(limits.black100)

      if (blackCount > 0) {
        let remaining = blackCount

        while (remaining >= 20) {
          groups.push({ color: 'black', count: 20 })
          remaining -= 20
        }

        if (remaining > 0) {
          groups.push({ color: 'black', count: remaining })
        }

        total += blackCount * CHIP_TYPES.black.value
      }
    }

    /* ========== 排序（现金桌：大 → 小）========== */
    const ORDER: CashColor[] = ['black', 'green', 'red', 'white']

    groups.sort((a, b) => ORDER.indexOf(a.color) - ORDER.indexOf(b.color))

    return { groups, total }
  }

  return { generate }
}
