import {
  CHIP_TYPES,
  splitRedStacks,
  splitGreenStacks,
  splitWhiteStacks,
} from './chipUtils'

/**
 * 现金桌颜色类型
 */
export type CashColor = 'white' | 'red' | 'green' | 'black'

export interface CashGameConfig {
  enabledColors: CashColor[]
  whiteRange: '1-20' | '20-60'
}

export function useCashGame(config: CashGameConfig) {
  function generate() {
    const groups: { color: CashColor; count: number }[] = []
    let total = 0

    const colors = config.enabledColors

    /* ========== 白色筹码（1）========== */
    if (colors.includes('white')) {
      const whiteCount =
        config.whiteRange === '1-20'
          ? Math.floor(Math.random() * 20) + 1
          : Math.floor(Math.random() * 41) + 20

      splitWhiteStacks(whiteCount).forEach((c) => {
        groups.push({ color: 'white', count: c })
      })

      total += whiteCount * CHIP_TYPES.white.value
    }

    /* ========== 红色筹码（5）========== */
    if (colors.includes('red')) {
      const redCount = Math.floor(Math.random() * 100)

      const choice = Math.random() < 0.5 ? 4 : 5

      splitRedStacks(redCount, choice).forEach((c) => {
        groups.push({ color: 'red', count: c })
      })

      total += redCount * CHIP_TYPES.red.value
    }

    /* ========== 绿色筹码（25）========== */
    if (colors.includes('green')) {
      const greenCount = Math.floor(Math.random() * 50)

      splitGreenStacks(greenCount).forEach((c) => {
        groups.push({ color: 'green', count: c })
      })

      total += greenCount * CHIP_TYPES.green.value
    }

    /* ========== 黑色筹码（100）========== */
    if (colors.includes('black')) {
      // 黑色固定 1–40
      const blackCount = Math.floor(Math.random() * 40) + 1

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

    /* ========== 排序（从大到小更符合现金桌直觉）========== */
    const ORDER: CashColor[] = ['black', 'green', 'red', 'white']

    groups.sort(
      (a, b) => ORDER.indexOf(a.color) - ORDER.indexOf(b.color)
    )

    return {
      groups,
      total,
    }
  }

  return {
    generate,
  }
}
