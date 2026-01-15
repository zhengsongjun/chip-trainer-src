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

/**
 * Cash Game Config
 * 已删除所有 range 相关配置
 */
export interface CashGameConfig {
  enabledColors: CashColor[]
}

export function useCashGame(config: CashGameConfig) {
  function generate() {
    const groups: { color: CashColor; count: number }[] = []
    let total = 0

    const colors = config.enabledColors

    /* ========== 白色筹码（1）========== */
    if (colors.includes('white')) {
      // 白色统一规则：1–40
      const whiteCount = Math.floor(Math.random() * 40) + 1

      splitWhiteStacks(whiteCount).forEach((c) => {
        groups.push({ color: 'white', count: c })
      })

      total += whiteCount * CHIP_TYPES.white.value
    }

    /* ========== 红色筹码（5）========== */
    if (colors.includes('red')) {
      const redCount = Math.floor(Math.random() * 100)

      // 红色拆分规则保持你原来的逻辑
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
      // 黑色统一规则：1–40
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

    /* ========== 排序（现金桌：大 → 小）========== */
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
