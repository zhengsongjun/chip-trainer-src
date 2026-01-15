// src/game/chipUtils.ts

/**
 * 筹码面额定义
 */
export const CHIP_TYPES = {
    white: { value: 1 },
    red: { value: 5 },
    green: { value: 25 },
    black: { value: 100 }
  }
  
  /**
   * 红色分组
   */
  export function splitRedStacks(count: number, choice: number) {
    const result: number[] = []
    let remaining = count
  
    while (remaining >= 20) {
      result.push(20)
      remaining -= 20
    }
  
    while (remaining > 5) {
      if (remaining >= choice) {
        result.push(choice)
        remaining -= choice
      }
    }
  
    if (remaining > 0) result.push(remaining)
    return result
  }
  
  /**
   * 绿色分组
   */
  export function splitGreenStacks(count: number) {
    const result: number[] = []
    let remaining = count
  
    while (remaining >= 20) {
      result.push(20)
      remaining -= 20
    }
  
    if (remaining > 0) {
      if (remaining === 6) result.push(4, 2)
      else if (remaining === 7) result.push(4, 3)
      else {
        while (remaining >= 4) {
          result.push(4)
          remaining -= 4
        }
        if (remaining > 0) result.push(remaining)
      }
    }
  
    return result
  }
  
  /**
   * 白色分组（20 / 5 / remainder）
   */
  export function splitWhiteStacks(count: number) {
    const result: number[] = []
    let remaining = count
  
    while (remaining >= 20) {
      result.push(20)
      remaining -= 20
    }
  
    while (remaining >= 5) {
      result.push(5)
      remaining -= 5
    }
  
    if (remaining > 0) result.push(remaining)
    return result
  }

  /**
 * 锦标赛筹码分组
 * 规则：
 * - >= 20：20 个一组
 * - < 20：用 smallGroupSize 分组
 */
export function splitTournamentStacks(
    count: number,
    smallGroupSize: number
  ) {
    const result: number[] = []
    let remaining = count
  
    while (remaining >= 20) {
      result.push(20)
      remaining -= 20
    }
  
    while (remaining >= smallGroupSize) {
      result.push(smallGroupSize)
      remaining -= smallGroupSize
    }
  
    if (remaining > 0) {
      result.push(remaining)
    }
  
    return result
  }
  
  