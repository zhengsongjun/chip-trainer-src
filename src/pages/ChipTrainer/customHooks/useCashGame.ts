import { CHIP_TYPES, splitWhiteStacks, splitRedStacks, splitGreenStacks } from '../utils/chipUtils'

/**
 * 现金桌颜色类型
 * —— 与 Chip.vue / 首页保持一致
 */
export type CashColor = 'white' | 'red' | 'green' | 'black' | 'pink' | 'purple' | 'brown'

/**
 * 单个筹码上限配置
 * key = 面额语义，而不是纯颜色
 */
export interface CashChipLimits {
  white1: number // 白色 1
  red5: number // 红色 5
  green25: number // 绿色 25
  black100: number // 黑色 100
  pink50: number // 粉色 50
  purple500: number // 紫色 500
  brown1000: number // 棕色 1000
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
    /* ================= 白色筹码（1）================= */
    if (enabledColors.includes('white')) {
      const count = randomCount(limits.white1)

      if (count > 0) {
        splitWhiteStacks(count).forEach((c) => {
          groups.push({ color: 'white', count: c })
        })

        total += count * CHIP_TYPES.white.value
      }
    }

    /* ================= 红色筹码（5）================= */
    if (enabledColors.includes('red')) {
      const count = randomCount(limits.red5)

      if (count > 0) {
        const choice = Math.random() < 0.5 ? 4 : 5

        splitRedStacks(count, choice).forEach((c) => {
          groups.push({ color: 'red', count: c })
        })

        total += count * CHIP_TYPES.red.value
      }
    }

    /* ================= 绿色筹码（25）================ */
    if (enabledColors.includes('green')) {
      const count = randomCount(limits.green25)

      if (count > 0) {
        splitGreenStacks(count).forEach((c) => {
          groups.push({ color: 'green', count: c })
        })

        total += count * CHIP_TYPES.green.value
      }
    }

    /* ================= 粉色筹码（50）================ */
    if (enabledColors.includes('pink')) {
      const count = randomCount(limits.pink50)
      if (count > 0) {
        splitWhiteStacks(count).forEach((c) => {
          groups.push({ color: 'pink', count: c })
        })
        total += count * 50
      }
    }

    /* ================= 黑色筹码（100）=============== */
    if (enabledColors.includes('black')) {
      const count = randomCount(limits.black100)

      if (count > 0) {
        let remaining = count

        // 20 个一整筒
        while (remaining > 20) {
          groups.push({ color: 'black', count: 20 })
          remaining -= 20
        }

        if (remaining === 20) {
          groups.push({ color: 'black', count: 20 })
        } else {
          // 剩余按 5 拆
          while (remaining > 5) {
            groups.push({ color: 'black', count: 5 })
            remaining -= 5
          }

          if (remaining > 0) {
            groups.push({ color: 'black', count: remaining })
          }
        }

        total += count * CHIP_TYPES.black.value
      }
    }

    /* ================= 紫色筹码（500）=============== */
    if (enabledColors.includes('purple')) {
      const count = randomCount(limits.purple500)
      if (count > 0) {
        splitWhiteStacks(count).forEach((c) => {
          groups.push({ color: 'purple', count: c })
        })
        total += count * 500
      }
    }

    /* ================= 棕色筹码（1000）============== */
    if (enabledColors.includes('brown')) {
      const count = randomCount(limits.brown1000)
      if (count > 0) {
        splitWhiteStacks(count).forEach((c) => {
          groups.push({ color: 'brown', count: c })
        })
        total += count * 1000
      }
    }

    /* ================= 排序（现金桌：大 → 小）================ */
    const ORDER: CashColor[] = ['brown', 'purple', 'black', 'pink', 'green', 'red', 'white']

    groups.sort((a, b) => ORDER.indexOf(a.color) - ORDER.indexOf(b.color))

    return { groups, total }
  }

  return { generate }
}
