/* ================= Types ================= */

type Level = 'high' | 'low' | 'kill' | 'none'
type ValidLevel = 'high' | 'low'

/* ================= Normalize ================= */

/**
 * normalize console 数据
 * - 忽略 kill
 * - key 强制转 number
 */
function normalizeConsoleMap(source: Record<number | string, Level>): Record<ValidLevel, number[]> {
  const result: Record<ValidLevel, number[]> = {
    high: [],
    low: [],
  }

  for (const [k, level] of Object.entries(source)) {
    if (level === 'kill' || level === 'none') continue
    result[level].push(Number(k))
  }

  return result
}

/**
 * normalize 页面数据
 * - 缺失 key 补空数组
 * - value 强制转 number
 */
function normalizePageMap(
  page: Partial<Record<ValidLevel, number[]>>
): Record<ValidLevel, number[]> {
  return {
    high: (page.high ?? []).map(Number),
    low: (page.low ?? []).map(Number),
  }
}

/* ================= Compare Helpers ================= */

/**
 * 忽略顺序的 number[] 比较
 */
function isSameNumberArray(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false

  const sa = new Set(a)
  const sb = new Set(b)

  if (sa.size !== sb.size) return false

  for (const v of sa) {
    if (!sb.has(v)) return false
  }

  return true
}

/* ================= Main Compare ================= */

/**
 * 核心比较函数
 * - 忽略 kill
 * - 忽略空数组 key
 * - 有值的 key 必须完全一致
 */
export function isSameLevelMapIgnoreEmpty(
  consoleMap: Record<number | string, Level>,
  pageMap: Partial<Record<ValidLevel, number[]>>
): boolean {
  const a = normalizeConsoleMap(consoleMap)
  const b = normalizePageMap(pageMap)

  const aEntries = Object.entries(a).filter(([, arr]) => arr.length > 0)
  const bEntries = Object.entries(b).filter(([, arr]) => arr.length > 0)

  // 有效 key 数量必须一致
  if (aEntries.length !== bEntries.length) return false

  for (const [level, arrA] of aEntries) {
    const arrB = b[level as ValidLevel]
    if (!arrB) return false
    if (!isSameNumberArray(arrA, arrB)) return false
  }

  return true
}
