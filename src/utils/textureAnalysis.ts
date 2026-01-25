/* ======================================================
 Texture Analysis – Omaha Board Only
 用于 TextureAnalysisPanel / 训练验证
 ====================================================== */

export type Card = string // 'as' | '10h'

export interface TextureBaseResult {
  hasPair: boolean
  hasFlush: boolean
  hasStraight: boolean
  hasStraightFlush: boolean
}

export interface ValidationResult {
  ok: boolean
  missing: string[]
  expected: string[]
  message?: string
}

/* ===============================
 Constants
=============================== */

const RANK_VALUE: Record<string, number> = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  t: 10,
  j: 11,
  q: 12,
  k: 13,
  a: 14,
}

const VALUE_RANK: Record<number, string> = {
  14: 'A',
  13: 'K',
  12: 'Q',
  11: 'J',
  10: 'T',
  9: '9',
  8: '8',
  7: '7',
  6: '6',
  5: '5',
  4: '4',
  3: '3',
  2: '2',
  1: 'A', // wheel
}

const SUITS = ['s', 'h', 'c', 'd']

/* ===============================
 Utils
=============================== */

function getRank(card: Card): number {
  return RANK_VALUE[card.slice(0, -1).toLowerCase()]
}

function getSuit(card: Card): string {
  return card.slice(-1).toLowerCase()
}

function normalizeInput(raw: string): string[] {
  return raw.trim().toUpperCase().split(/\s+/).filter(Boolean)
}

function rankChar(r: number): string {
  return VALUE_RANK[r]
}

/* ===============================
 Base Texture Analysis
=============================== */

export function analyzeBoardTexture(board: Card[]): TextureBaseResult {
  const ranks = board.map(getRank)
  const suits = board.map(getSuit)

  /* Pair */
  const rankCount: Record<number, number> = {}
  ranks.forEach((r) => (rankCount[r] = (rankCount[r] || 0) + 1))
  const hasPair = Object.values(rankCount).some((v) => v >= 2)

  /* Flush (Omaha 教学：公共牌 ≥2 同花即可算潜力) */
  const suitCount: Record<string, number> = {}
  suits.forEach((s) => (suitCount[s] = (suitCount[s] || 0) + 1))
  const hasFlush = Object.values(suitCount).some((v) => v >= 2)

  /* Straight potential */
  const hasStraight = getStraightWindows(board).length > 0

  /* Straight Flush potential */
  const hasStraightFlush = getStraightFlushWindows(board).length > 0

  return {
    hasPair,
    hasFlush,
    hasStraight,
    hasStraightFlush,
  }
}

/* ===============================
 Straight Windows (Omaha)
=============================== */

function normalizeRanksWithAce(board: Card[]): number[] {
  const set = new Set<number>()
  board.forEach((c) => {
    const r = getRank(c)
    set.add(r)
    if (r === 14) set.add(1) // A2345
  })
  return [...set].sort((a, b) => a - b)
}

function getStraightWindows(board: Card[]): number[][] {
  const ranks = normalizeRanksWithAce(board)
  const windows: number[][] = []

  for (let start = 1; start <= 10; start++) {
    const seq = [start, start + 1, start + 2, start + 3, start + 4]
    const hit = seq.filter((r) => ranks.includes(r))

    // Omaha 教学：≥3 公共牌命中，才叫顺子潜力
    if (hit.length >= 3) {
      windows.push(seq)
    }
  }

  return windows
}

/* ===============================
 Straight Missing (Omaha)
=============================== */

export function getStraightMissing(board: Card[]): string[] {
  const ranks = normalizeRanksWithAce(board)
  const result = new Set<string>()

  getStraightWindows(board).forEach((seq) => {
    const missing = seq.filter((r) => !ranks.includes(r))

    // 🚫 Omaha：最多用 2 张手牌补
    if (missing.length > 2) return

    if (missing.length === 1) {
      result.add(`LIVE_${rankChar(missing[0])}`)
      return
    }

    if (missing.length === 2) {
      result.add([rankChar(missing[0]), rankChar(missing[1])].sort().join(''))
    }
  })

  return [...result]
}

/* ===============================
 Straight Flush Windows
=============================== */

function getStraightFlushWindows(board: Card[]) {
  const suitMap: Record<string, number[]> = {}

  board.forEach((c) => {
    const suit = getSuit(c)
    const rank = getRank(c)

    if (!suitMap[suit]) suitMap[suit] = []
    suitMap[suit].push(rank)
    if (rank === 14) suitMap[suit].push(1)
  })

  const windows: { suit: string; seq: number[] }[] = []

  Object.entries(suitMap).forEach(([suit, ranks]) => {
    const uniq = Array.from(new Set(ranks)).sort((a, b) => a - b)

    // 🚫 Omaha：公共牌同花至少 3 张，才可能同花顺
    if (uniq.length < 3) return

    for (let start = 1; start <= 10; start++) {
      const seq = [start, start + 1, start + 2, start + 3, start + 4]
      const hit = seq.filter((r) => uniq.includes(r))

      if (hit.length >= 3) {
        windows.push({ suit, seq })
      }
    }
  })

  return windows
}

/* ===============================
 Straight Flush Missing
=============================== */

export function getStraightFlushMissing(board: Card[]): string[] {
  const result = new Set<string>()

  getStraightFlushWindows(board).forEach(({ suit, seq }) => {
    const ranks = normalizeRanksWithAce(board.filter((c) => getSuit(c) === suit))

    seq.forEach((r) => {
      if (!ranks.includes(r)) {
        result.add(rankChar(r) + suit)
      }
    })
  })

  return [...result]
}

/* ===============================
 Validation – Straight Missing
=============================== */

export function validateStraightMissingInput(board: Card[], userInput: string): ValidationResult {
  const expected = getStraightMissing(board)
  const tokens = normalizeInput(userInput)

  if (expected.length === 0) {
    return {
      ok: false,
      expected,
      missing: [],
      message: '该公共牌不存在顺子潜力',
    }
  }

  if (tokens.length === 0) {
    return {
      ok: false,
      expected,
      missing: expected,
      message: '请输入顺子缺张',
    }
  }

  const user = new Set<string>()

  for (const t of tokens) {
    if (t.startsWith('LIVE_')) {
      user.add(t)
      continue
    }

    // 必须是两个 rank
    if (t.length !== 2) {
      return {
        ok: false,
        expected,
        missing: expected,
        message: '顺子缺张必须输入两张牌（如 57）或 LIVE_X',
      }
    }

    user.add(t.split('').sort().join(''))
  }

  const missing = expected.filter((e) => !user.has(e))
  const extra = [...user].filter((u) => !expected.includes(u))

  if (missing.length === 0 && extra.length === 0) {
    return {
      ok: true,
      expected,
      missing: [],
      message: 'Correct',
    }
  }

  return {
    ok: false,
    expected,
    missing,
    message: missing.length > 0 ? `漏了：${missing.join(' , ')}` : '输入了无效缺张',
  }
}

/* ===============================
 Validation – Straight Flush Missing
=============================== */

export function validateStraightFlushMissingInput(
  board: Card[],
  userInput: string
): ValidationResult {
  const expected = getStraightFlushMissing(board)

  if (expected.length === 0) {
    return {
      ok: false,
      expected,
      missing: [],
      message: '无法组成同花顺',
    }
  }

  const user = new Set(normalizeInput(userInput).map((s) => s.toLowerCase()))

  if (user.size === 0) {
    return {
      ok: false,
      expected,
      missing: expected,
      message: '请输入同花顺缺张',
    }
  }

  const missing = expected.filter((e) => !user.has(e.toLowerCase()))

  return {
    ok: missing.length === 0,
    expected,
    missing,
    message: missing.length === 0 ? 'Correct' : `漏了：${missing.join(', ')}`,
  }
}
