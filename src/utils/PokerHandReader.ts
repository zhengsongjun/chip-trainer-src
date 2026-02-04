import { Hand } from 'pokersolver'

export type Card = string // 'as' | '10h'
export type PlayerHands = Record<number, Card[]> // 座位号 -> 手牌

export interface HandResult {
  seat: number
  hand: any // pokersolver 返回的 Hand 对象
}

export interface LowHandResult {
  seat: number
  cards: string[]
  valid: boolean
}

export interface WinnerResult {
  seats: number[]
  hands: any[]
  descr: string
}

/**
 * 将卡片转换为 pokersolver 格式
 * 输入格式: 'as' -> 输出格式: 'As'
 * 输入格式: '10h' -> 输出格式: '10h'
 */
function toSolverCard(card: string): string {
    const suit = card.slice(-1)
    const rawRank = card.slice(0, -1)

    const rankMap: Record<string, string> = {
        a: 'A',
        k: 'K',
        q: 'Q',
        j: 'J',
        t: 'T',
        '10': 'T',
        '9': '9',
        '8': '8',
        '7': '7',
        '6': '6',
        '5': '5',
        '4': '4',
        '3': '3',
        '2': '2',
    }

    const rank = rankMap[rawRank.toLowerCase()] || rawRank
    return rank + suit
}

/**
 * 组合函数：从数组中选择 n 个元素的所有组合
 */
function combinations<T>(arr: T[], n: number): T[][] {
  if (n === 0) return [[]]
  if (arr.length === n) return [arr]
  if (arr.length < n) return []

  const [first, ...rest] = arr
  const withFirst = combinations(rest, n - 1).map((comb) => [first, ...comb])
  const withoutFirst = combinations(rest, n)

  return [...withFirst, ...withoutFirst]
}

/**
 * 7 Card Stud 高牌读取器
 * 输入：所有玩家手牌对象（每个玩家3张hole cards + 4张stud cards）
 * 输出：胜利者信息（座位号、手牌对象、牌型描述）
 */
export function read7CardHandHigh(
  playerHands: PlayerHands,
  playerStudCards: Record<number, Card[]> = {}
): WinnerResult {
  // 计算每个玩家的最佳手牌（3张hole cards + 4张stud cards中选5张最好的）
  const solvedPlayers: HandResult[] = Object.entries(playerHands).map(([seat, cards]) => {
    const seatNum = Number(seat)
    const allCards = [...cards, ...(playerStudCards[seatNum] || [])]
    const allCombinations = combinations(allCards, 5)
    const allPossibleHands = allCombinations.map(combo =>
      Hand.solve(combo.map(toSolverCard))
    )

    const bestHand = Hand.winners(allPossibleHands)[0]
    return {
      seat: seatNum,
      hand: bestHand,
    }
  })

  // 找出最好的手牌
  const highWinners = Hand.winners(solvedPlayers.map((s) => s.hand))
  const winnerSeats = solvedPlayers
    .filter((s) => highWinners.includes(s.hand))
    .map((s) => s.seat)
    .sort((a, b) => a - b)

  const winnerHands = solvedPlayers
    .filter((s) => winnerSeats.includes(s.seat))
    .map((s) => s.hand)

  return {
    seats: winnerSeats,
    hands: winnerHands,
    descr: winnerHands[0]?.descr || '',
  }
}

/**
 * Lowball A-5 分数计算函数
 * 计算 5 张牌的 A-5 低牌分数
 * 顺子、同花不影响牌力
 * 牌型权重：高牌(0) < 一对(1) < 两对(2) < 三条(3) < 葫芦(4) < 四条(5)
 * 分数计算：牌型权重 * 1000000 + 高牌比较值（每个高牌占4位，最大13）
 */
export function getLowballA5Score(cards: string[]): { score: number; highCards: number[] } {
  const rankValues: Record<string, number> = {
    A: 1,
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    T: 10,
    J: 11,
    Q: 12,
    K: 13,
  }

  const ranks = cards.map((c) => c[0])
  const values = ranks.map((r) => rankValues[r])

  // 统计每个点数的数量
  const rankCounts = new Map<number, number>()
  for (const v of values) {
    rankCounts.set(v, (rankCounts.get(v) || 0) + 1)
  }

  // 判断牌型
  const counts = Array.from(rankCounts.values()).sort((a, b) => b - a)
  let handType = 0 // 0=高牌, 1=一对, 2=两对, 3=三条, 4=葫芦, 5=四条

  if (counts[0] === 4)
    handType = 5 // 四条
  else if (counts[0] === 3 && counts[1] === 2)
    handType = 4 // 葫芦
  else if (counts[0] === 3)
    handType = 3 // 三条
  else if (counts[0] === 2 && counts[1] === 2)
    handType = 2 // 两对
  else if (counts[0] === 2) handType = 1 // 一对

  // 根据不同牌型确定正确的高牌比较顺序
  let highCards: number[]
  if (handType === 1) { // 一对
    // 先找到对子的点数，然后将其他牌从大到小排列
    const pairRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 2)![0]
    const otherRanks = Array.from(rankCounts.entries()).filter(([_, count]) => count === 1).map(([rank]) => rank).sort((a, b) => b - a)
    highCards = [pairRank, ...otherRanks]
  } else if (handType === 2) { // 两对
    // 先比较大的对子，然后小的对子，然后单张
    const pairRanks = Array.from(rankCounts.entries()).filter(([_, count]) => count === 2).map(([rank]) => rank).sort((a, b) => b - a)
    const singleRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 1)![0]
    highCards = [...pairRanks, singleRank]
  } else if (handType === 3) { // 三条
    // 先比较三条的点数，然后是单张
    const threeRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 3)![0]
    const otherRanks = Array.from(rankCounts.entries()).filter(([_, count]) => count === 1).map(([rank]) => rank).sort((a, b) => b - a)
    highCards = [threeRank, ...otherRanks]
  } else if (handType === 4) { // 葫芦
    // 先比较三条的点数，然后是对子的点数
    const threeRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 3)![0]
    const pairRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 2)![0]
    highCards = [threeRank, pairRank]
  } else if (handType === 5) { // 四条
    // 先比较四条的点数，然后是单张
    const fourRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 4)![0]
    const singleRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 1)![0]
    highCards = [fourRank, singleRank]
  } else { // 高牌
    // 从大到小排序
    highCards = values.sort((a, b) => b - a)
  }

  // 将高牌值编码到分数中，使分数可以直接比较
  // 每个高牌占4位（最大13），5张牌需要20位，乘以牌型权重后相加
  let highCardValue = 0
  highCards.forEach((card, index) => {
    highCardValue += card * Math.pow(16, highCards.length - 1 - index)
  })

  return { score: handType * 1000000 + highCardValue, highCards }
}

/**
 * 获取 Lowball A-5 模式下的最佳 Low 牌（直接使用5张手牌）
 */
function getLowballA5Hand(cards: string[]): { cards: string[]; score: number; highCards: number[] } {
  const solverCards = cards.map(toSolverCard)
  const scoreResult = getLowballA5Score(solverCards)
  return { cards: solverCards, ...scoreResult }
}

/**
 * 比较两手 Lowball A-5 牌的高牌（从大到小比较，高牌越低越好）
 */
function compareHighCards(hand1: number[], hand2: number[]): number {
  for (let i = 0; i < hand1.length; i++) {
    if (hand1[i] < hand2[i]) return -1 // hand1 更好
    if (hand1[i] > hand2[i]) return 1 // hand2 更好
  }
  return 0 // 平局
}

/**
 * 5 Card Lowball A-5 手牌读取器
 * 输入：2-8个手牌，每个手牌5张牌
 * 输出：胜利者信息（座位号、手牌对象、牌型描述）
 *
 * 牌力规则（从强到弱，即越低越好）：
 * 高牌(0) < 一对(1) < 两对(2) < 三条(3) < 葫芦(4) < 四条(5)
 * 顺子、同花不影响牌力
 * 相同牌型比较高牌（从大到小比较，高牌越低越好）
 */
export function read5CardA5LowHands(
  playerHands: PlayerHands
): WinnerResult {
  const handTypeDescriptions = [
    'High Card',
    'One Pair',
    'Two Pair',
    'Three of a Kind',
    'Full House',
    'Four of a Kind'
  ]

  // 计算每个玩家的 Lowball A-5 手牌
  const solvedLowball = Object.entries(playerHands).map(([seat, cards]) => {
    const lowballHand = getLowballA5Hand(cards)
    return {
      seat: Number(seat),
      lowballHand,
    }
  })

  // 找出最好的 Lowball A-5 牌
  let bestLowball = solvedLowball[0]
  for (const player of solvedLowball) {
    if (
      player.lowballHand.score < bestLowball.lowballHand.score ||
      (player.lowballHand.score === bestLowball.lowballHand.score &&
        compareHighCards(player.lowballHand.highCards, bestLowball.lowballHand.highCards) < 0)
    ) {
      bestLowball = player
    }
  }

  // 找出所有平局的玩家
  const winnerSeats = solvedLowball
    .filter(
      (p) =>
        p.lowballHand.score === bestLowball.lowballHand.score &&
        compareHighCards(p.lowballHand.highCards, bestLowball.lowballHand.highCards) === 0
    )
    .map((p) => p.seat)
    .sort((a, b) => a - b)

  const winnerHands = solvedLowball
    .filter((p) => winnerSeats.includes(p.seat))
    .map((p) => {
      const handType = Math.floor(p.lowballHand.score / 1000000)
      const handDescription = handTypeDescriptions[handType]
      return {
        cards: p.lowballHand.cards,
        score: p.lowballHand.score,
        highCards: p.lowballHand.highCards,
        descr: `${handDescription}: ${p.lowballHand.cards.join(' ')}`,
      }
    })

  const bestHandType = Math.floor(bestLowball.lowballHand.score / 1000000)
  const bestHandDescription = handTypeDescriptions[bestHandType]
  const bestHandDescr = `${bestHandDescription}: ${bestLowball.lowballHand.cards.join(' ')}`

  return {
    seats: winnerSeats,
    hands: winnerHands,
    descr: bestHandDescr,
  }
}

/**
 * 7 Card Stud A-5 Regular Low 手牌读取器（无8/Better限制）
 * 输入：2-8个手牌，每个手牌7张牌
 * 输出：胜利者信息（座位号、手牌对象、牌型描述）
 *
 * 牌力规则：从7张牌中选5张最好的A-5 Low牌型，无8/Better限制（有对子也可以）
 * 牌型权重：高牌(0) < 一对(1) < 两对(2) < 三条(3) < 葫芦(4) < 四条(5)
 * 顺子、同花不影响牌力
 */
export function read7CardHandLowA5Regular(
  playerHands: PlayerHands,
  playerStudCards: Record<number, Card[]> = {}
): WinnerResult {
  // 计算每个玩家的最佳 Low 牌（7张牌中选5张）
  const solvedPlayers = Object.entries(playerHands).map(([seat, cards]) => {
    const seatNum = Number(seat)
    const allCards = [...cards, ...(playerStudCards[seatNum] || [])]
    const allCombinations = combinations(allCards, 5)

    // 找出最佳的5张牌组合
    let bestLowHand = getLowballA5Hand(allCombinations[0])
    for (let i = 1; i < allCombinations.length; i++) {
      const currentHand = getLowballA5Hand(allCombinations[i])
      if (
        currentHand.score < bestLowHand.score ||
        (currentHand.score === bestLowHand.score &&
          compareHighCards(currentHand.highCards, bestLowHand.highCards) < 0)
      ) {
        bestLowHand = currentHand
      }
    }

    return {
      seat: seatNum,
      lowballHand: bestLowHand,
    }
  })

  // 找出最好的 Lowball A-5 牌
  let bestLowball = solvedPlayers[0]
  for (const player of solvedPlayers) {
    if (
      player.lowballHand.score < bestLowball.lowballHand.score ||
      (player.lowballHand.score === bestLowball.lowballHand.score &&
        compareHighCards(player.lowballHand.highCards, bestLowball.lowballHand.highCards) < 0)
    ) {
      bestLowball = player
    }
  }

  // 找出所有平局的玩家
  const winnerSeats = solvedPlayers
    .filter(
      (p) =>
        p.lowballHand.score === bestLowball.lowballHand.score &&
        compareHighCards(p.lowballHand.highCards, bestLowball.lowballHand.highCards) === 0
    )
    .map((p) => p.seat)
    .sort((a, b) => a - b)

  const handTypeDescriptions = [
    'High Card',
    'One Pair',
    'Two Pair',
    'Three of a Kind',
    'Full House',
    'Four of a Kind'
  ]

  const winnerHands = solvedPlayers
    .filter((p) => winnerSeats.includes(p.seat))
    .map((p) => {
      const handType = Math.floor(p.lowballHand.score / 1000000)
      const handDescription = handTypeDescriptions[handType]
      return {
        cards: p.lowballHand.cards,
        score: p.lowballHand.score,
        highCards: p.lowballHand.highCards,
        descr: `${handDescription}: ${p.lowballHand.cards.join(' ')}`,
      }
    })

  const bestHandType = Math.floor(bestLowball.lowballHand.score / 1000000)
  const bestHandDescription = handTypeDescriptions[bestHandType]
  const bestHandDescr = `${bestHandDescription}: ${bestLowball.lowballHand.cards.join(' ')}`

  return {
    seats: winnerSeats,
    hands: winnerHands,
    descr: bestHandDescr,
  }
}

/**
 * 检查一手牌是否是有效的 A-5 Low 牌 (8 or better)
 */
function checkLow8orBetterHand(
  cards: string[],
  rankValues: Record<string, number>
): { cards: string[]; valid: boolean } {
  const ranks = cards.map((c) => c[0])
  const values = ranks.map((r) => rankValues[r])

  // 检查是否所有牌都 ≤8
  const allUnder8 = values.every((v) => v <= 8)
  if (!allUnder8) {
    return { cards: [], valid: false }
  }

  // 检查是否有对子
  const rankCounts = new Map<number, number>()
  for (const v of values) {
    rankCounts.set(v, (rankCounts.get(v) || 0) + 1)
  }
  const hasPair = Array.from(rankCounts.values()).some((count) => count > 1)
  if (hasPair) {
    return { cards: [], valid: false }
  }

  return { cards, valid: true }
}

/**
 * 7 Card Stud A-5 Low 8 or Better 手牌读取器（有8/Better限制）
 * 输入：2-8个手牌，每个手牌7张牌
 * 输出：胜利者信息（座位号、手牌对象、牌型描述）
 *
 * 牌力规则：从7张牌中选5张最好的A-5 Low牌型，必须满足8/Better限制
 * 即：无对子，且所有牌 ≤8
 */
export function read7CardHandLow8orBetter(
  playerHands: PlayerHands,
  playerStudCards: Record<number, Card[]> = {}
): WinnerResult {
  const rankValues: Record<string, number> = {
    A: 1,
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    T: 10,
    J: 11,
    Q: 12,
    K: 13,
  }

  // 计算每个玩家的最佳 Low 牌（7张牌中选5张）
  const solvedPlayers: LowHandResult[] = Object.entries(playerHands).map(([seat, cards]) => {
    const seatNum = Number(seat)
    const allCards = [...cards, ...(playerStudCards[seatNum] || [])]
    const allCombinations = combinations(allCards, 5)

    let bestLow: string[] | null = null

    for (const combo of allCombinations) {
      const solverCards = combo.map(toSolverCard)
      const lowResult = checkLow8orBetterHand(solverCards, rankValues)
      if (lowResult.valid) {
        if (!bestLow || compareLowHands(lowResult.cards, bestLow, rankValues) < 0) {
          bestLow = lowResult.cards
        }
      }
    }

    return {
      seat: seatNum,
      cards: bestLow || [],
      valid: !!bestLow,
    }
  })

  // 找出有效的 Low 牌
  const validLowPlayers = solvedPlayers.filter((s) => s.valid)

  if (validLowPlayers.length === 0) {
    return {
      seats: [],
      hands: [],
      descr: 'No qualifying low',
    }
  }

  // 找出最好的 Low 牌
  let bestLow = validLowPlayers[0]
  for (const player of validLowPlayers) {
    if (compareLowHands(player.cards, bestLow.cards, rankValues) < 0) {
      bestLow = player
    }
  }

  // 找出所有平局的玩家
  const winnerSeats = validLowPlayers
    .filter((p) => compareLowHands(p.cards, bestLow.cards, rankValues) === 0)
    .map((p) => p.seat)
    .sort((a, b) => a - b)

  const winnerHands = validLowPlayers
    .filter((p) => winnerSeats.includes(p.seat))
    .map((p) => ({
      cards: p.cards,
      descr: p.cards.join(' '),
    }))

  return {
    seats: winnerSeats,
    hands: winnerHands,
    descr: bestLow.cards.join(' '),
  }
}

/**
 * 检查牌型是否 qualify（至少一对 9 或以上）
 * 用于 Ari 和 Archie 的 High 判断
 */
function checkHighQualifier9sOrBetter(hand: any): boolean {
  const handName = hand.name.toLowerCase()

  // 高牌不 qualify
  if (handName === 'high card') {
    return false
  }

  // 一对：需要检查对子的点数
  if (handName === 'pair') {
    // pokersolver 数字映射（从 1 开始）
    // 2=1, 3=2, 4=3, 5=4, 6=5, 7=6, 8=7, 9=8, T=9, J=10, Q=11, K=12, A=13
    const rankValueNumber: Record<number, number> = {
      1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 10: 11, 11: 12, 12: 13, 13: 14
    }
    const rankValueString: Record<string, number> = {
      '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
      'T': 10, 't': 10, '10': 10,
      'J': 11, 'j': 11,
      'Q': 12, 'q': 12,
      'K': 13, 'k': 13,
      'A': 14, 'a': 14
    }

    // 找到对子的点数：统计每个点数出现的次数
    const rankCounts = new Map<any, number>()
    for (const card of hand.cards) {
      const rank = card.rank || card.value
      rankCounts.set(rank, (rankCounts.get(rank) || 0) + 1)
    }

    // 找出出现2次的点数（对子）
    for (const [rank, count] of rankCounts.entries()) {
      if (count === 2) {
        let pairValue = 0
        if (typeof rank === 'string') {
          pairValue = rankValueString[rank] || 0
        } else if (typeof rank === 'number') {
          pairValue = rankValueNumber[rank] || 0
        }
        return pairValue >= 9 // 至少一对 9
      }
    }
    return false
  }

  // 其他所有牌型都 qualify（两对、三条、顺子、同花、葫芦、四条、同花顺等）
  return true
}

/**
 * 6 Card High 9s or Better 手牌读取器（用于 Ari）
 * 输入：2-8个玩家手牌，每手6张牌（5张手牌 + 1张公共牌）
 * 输出：胜利者信息（座位号、手牌对象、牌型描述）
 *
 * Qualifier: 至少一对 9 或以上
 * 从6张牌中选出最好的5张高牌
 */
export function read6CardsHigh9sOrBetter(
  playerHands: PlayerHands
): WinnerResult {
  // 计算每个玩家的最佳手牌（6张牌中选5张最好的）
  const solvedPlayers = Object.entries(playerHands).map(([seat, cards]) => {
    const seatNum = Number(seat)
    const allCombinations = combinations(cards, 5)
    const allPossibleHands = allCombinations.map(combo =>
      Hand.solve(combo.map(toSolverCard))
    )

    const bestHand = Hand.winners(allPossibleHands)[0]
    const qualified = checkHighQualifier9sOrBetter(bestHand)

    return {
      seat: seatNum,
      hand: bestHand,
      qualified,
    }
  })

  // 只考虑 qualify 的玩家
  const qualifiedPlayers = solvedPlayers.filter((s) => s.qualified)

  if (qualifiedPlayers.length === 0) {
    return {
      seats: [],
      hands: [],
      descr: 'No qualifying high',
    }
  }

  // 找出最好的手牌
  const highWinners = Hand.winners(qualifiedPlayers.map((s) => s.hand))
  const winnerSeats = qualifiedPlayers
    .filter((s) => highWinners.includes(s.hand))
    .map((s) => s.seat)
    .sort((a, b) => a - b)

  const winnerHands = qualifiedPlayers
    .filter((s) => winnerSeats.includes(s.seat))
    .map((s) => s.hand)

  return {
    seats: winnerSeats,
    hands: winnerHands,
    descr: winnerHands[0]?.descr || '',
  }
}

/**
 * 5 Card A-5 Low 8 or Better 手牌读取器（用于 Ari）
 * 输入：2-8个玩家手牌，每手5张牌
 * 输出：胜利者信息（座位号、手牌对象、牌型描述）
 *
 * Qualifier: 5张牌点数各不相同，所有牌都≤8
 * A=1，顺子和同花不影响牌力
 */
export function read5CardA5Low8orBetter(
  playerHands: PlayerHands
): WinnerResult {
  const rankValues: Record<string, number> = {
    A: 1,
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    T: 10,
    J: 11,
    Q: 12,
    K: 13,
  }

  // 计算每个玩家的 Low 牌
  const solvedPlayers = Object.entries(playerHands).map(([seat, cards]) => {
    const seatNum = Number(seat)
    const solverCards = cards.map(toSolverCard)
    const ranks = solverCards.map((c) => c[0])
    const values = ranks.map((r) => rankValues[r])

    // 检查是否所有牌都 ≤8
    const allUnder8 = values.every((v) => v <= 8)
    if (!allUnder8) {
      return { seat: seatNum, cards: [] as string[], valid: false, highCards: [] as number[] }
    }

    // 检查是否有重复点数
    const rankCounts = new Map<number, number>()
    for (const v of values) {
      rankCounts.set(v, (rankCounts.get(v) || 0) + 1)
    }
    const hasPair = Array.from(rankCounts.values()).some((count) => count > 1)
    if (hasPair) {
      return { seat: seatNum, cards: [] as string[], valid: false, highCards: [] as number[] }
    }

    // Qualify 成功，从大到小排序用于比较
    const highCards = values.sort((a, b) => b - a)

    return { seat: seatNum, cards: solverCards, valid: true, highCards }
  })

  // 找出有效的 Low 牌
  const validLowPlayers = solvedPlayers.filter((s) => s.valid)

  if (validLowPlayers.length === 0) {
    return {
      seats: [],
      hands: [],
      descr: 'No qualifying low',
    }
  }

  // 找出最好的 Low 牌（高牌最低的）
  let bestLow = validLowPlayers[0]
  for (const player of validLowPlayers) {
    if (compareHighCards(player.highCards, bestLow.highCards) < 0) {
      bestLow = player
    }
  }

  // 找出所有平局的玩家
  const winnerSeats = validLowPlayers
    .filter((p) => compareHighCards(p.highCards, bestLow.highCards) === 0)
    .map((p) => p.seat)
    .sort((a, b) => a - b)

  const winnerHands = validLowPlayers
    .filter((p) => winnerSeats.includes(p.seat))
    .map((p) => ({
      cards: p.cards,
      highCards: p.highCards,
      descr: p.cards.join(' '),
    }))

  return {
    seats: winnerSeats,
    hands: winnerHands,
    descr: bestLow.cards.join(' '),
  }
}



/**
 * Hold'em 手牌读取器
 * 输入：5张公共牌，所有玩家手牌对象
 * 输出：胜利者信息（座位号、手牌对象、牌型描述）
 */
export function readHoldemHandHigh(
  board: Card[],
  playerHands: PlayerHands
): WinnerResult {
  // 计算每个玩家的最佳手牌
  const solvedPlayers: HandResult[] = Object.entries(playerHands).map(([seat, cards]) => {
    const hand = Hand.solve([...cards, ...board].map(toSolverCard))
    return {
      seat: Number(seat),
      hand,
    }
  })

  // 找出最好的手牌
  const highWinners = Hand.winners(solvedPlayers.map((s) => s.hand))
  const winnerSeats = solvedPlayers
    .filter((s) => highWinners.includes(s.hand))
    .map((s) => s.seat)
    .sort((a, b) => a - b)

  const winnerHands = solvedPlayers
    .filter((s) => winnerSeats.includes(s.seat))
    .map((s) => s.hand)

  return {
    seats: winnerSeats,
    hands: winnerHands,
    descr: winnerHands[0]?.descr || '',
  }
}

/**
 * 5 Card Draw 高牌读取器
 * 输入：2-8个玩家手牌，每手5张牌
 * 输出：胜利者信息（座位号、手牌对象、牌型描述）
 */
export function read5CardHigh(playerHands: PlayerHands): WinnerResult {
  // 计算每个玩家的手牌（5张牌直接组成一手牌）
  const solvedPlayers: HandResult[] = Object.entries(playerHands).map(([seat, cards]) => {
    const hand = Hand.solve(cards.map(toSolverCard))
    return {
      seat: Number(seat),
      hand,
    }
  })

  // 找出最好的手牌
  const highWinners = Hand.winners(solvedPlayers.map((s) => s.hand))
  const winnerSeats = solvedPlayers
    .filter((s) => highWinners.includes(s.hand))
    .map((s) => s.seat)
    .sort((a, b) => a - b)

  const winnerHands = solvedPlayers
    .filter((s) => winnerSeats.includes(s.seat))
    .map((s) => s.hand)

  return {
    seats: winnerSeats,
    hands: winnerHands,
    descr: winnerHands[0]?.descr || '',
  }
}

/**
 * Drawmaha 49 结果接口
 */
export interface Drawmaha49Result {
  seats: number[]
  scores: number[]
  descr: string
}

/**
 * Drawmaha 49 手牌读取器
 * 输入：2-8个玩家手牌，每手5张牌
 * 输出：胜利者信息（座位号、分数、描述）
 *
 * 规则：5张牌点数之和最接近49的获胜
 * J/Q/K = 0, A = 1, 2-10 = 面值
 */
export function read5Card49(playerHands: PlayerHands): Drawmaha49Result {
  const rankValues: Record<string, number> = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    T: 10, '10': 10, J: 0, Q: 0, K: 0, A: 1,
  }

  // 计算每个玩家的分数
  const solvedPlayers = Object.entries(playerHands).map(([seat, cards]) => {
    const solverCards = cards.map(toSolverCard)
    let totalScore = 0
    for (const card of solverCards) {
      const rank = card[0]
      totalScore += rankValues[rank] || 0
    }
    const distanceTo49 = Math.abs(totalScore - 49)
    return {
      seat: Number(seat),
      totalScore,
      distanceTo49,
    }
  })

  // 找出最接近49的玩家（距离最小）
  const minDistance = Math.min(...solvedPlayers.map(p => p.distanceTo49))
  const winnerSeats = solvedPlayers
    .filter(p => p.distanceTo49 === minDistance)
    .map(p => p.seat)
    .sort((a, b) => a - b)

  const winnerScores = solvedPlayers
    .filter(p => winnerSeats.includes(p.seat))
    .map(p => p.distanceTo49)

  const bestPlayer = solvedPlayers.find(p => p.seat === winnerSeats[0])
  const descr = `Score: ${bestPlayer?.totalScore} (distance to 49: ${bestPlayer?.distanceTo49})`

  return {
    seats: winnerSeats,
    scores: winnerScores,
    descr,
  }
}

/**
 * Drawmaha Zero 结果接口
 */
export interface DrawmahaZeroResult {
  seats: number[]
  scores: number[]
  descr: string
}

/**
 * Drawmaha Zero 手牌读取器
 * 输入：2-8个玩家手牌，每手5张牌
 * 输出：胜利者信息（座位号、分数、描述）
 *
 * 规则：5张牌点数之和最接近0的获胜
 * J/Q/K = 0, A = 1, 2-10 = 面值
 */
export function read5CardZero(playerHands: PlayerHands): DrawmahaZeroResult {
  const rankValues: Record<string, number> = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    T: 10, '10': 10, J: 0, Q: 0, K: 0, A: 1,
  }

  // 计算每个玩家的分数
  const solvedPlayers = Object.entries(playerHands).map(([seat, cards]) => {
    const solverCards = cards.map(toSolverCard)
    let totalScore = 0
    for (const card of solverCards) {
      const rank = card[0]
      totalScore += rankValues[rank] || 0
    }
    return {
      seat: Number(seat),
      totalScore,
    }
  })

  // 找出最接近0的玩家（分数最小）
  const minScore = Math.min(...solvedPlayers.map(p => p.totalScore))
  const winnerSeats = solvedPlayers
    .filter(p => p.totalScore === minScore)
    .map(p => p.seat)
    .sort((a, b) => a - b)

  const winnerScores = solvedPlayers
    .filter(p => winnerSeats.includes(p.seat))
    .map(p => p.totalScore)

  const bestPlayer = solvedPlayers.find(p => p.seat === winnerSeats[0])
  const descr = `Score: ${bestPlayer?.totalScore}`

  return {
    seats: winnerSeats,
    scores: winnerScores,
    descr,
  }
}

/**
 * Omaha/Big O 高牌读取器
 * 输入：5张公共牌，所有玩家手牌对象
 * 输出：胜利者信息（座位号、手牌对象、牌型描述）
 */
export function readOmahaHandHigh(
  board: Card[],
  playerHands: PlayerHands
): WinnerResult {
  // 计算每个玩家的最佳手牌
  const solvedPlayers: HandResult[] = Object.entries(playerHands).map(([seat, cards]) => {
    const holeCombos = combinations(cards, 2)
    const boardCombos = combinations(board, 3)

    const allPossibleHands = []
    for (const hole of holeCombos) {
      for (const boardPart of boardCombos) {
        const hand = Hand.solve([...hole, ...boardPart].map(toSolverCard))
        allPossibleHands.push(hand)
      }
    }

    const bestHand = Hand.winners(allPossibleHands)[0]
    return {
      seat: Number(seat),
      hand: bestHand,
    }
  })

  // 找出最好的手牌
  const highWinners = Hand.winners(solvedPlayers.map((s) => s.hand))
  const winnerSeats = solvedPlayers
    .filter((s) => highWinners.includes(s.hand))
    .map((s) => s.seat)
    .sort((a, b) => a - b)

  const winnerHands = solvedPlayers
    .filter((s) => winnerSeats.includes(s.seat))
    .map((s) => s.hand)

  return {
    seats: winnerSeats,
    hands: winnerHands,
    descr: winnerHands[0]?.descr || '',
  }
}

/**
 * 检查一手牌是否是有效的 A-5 Low 牌 (8 or better)
 */
function checkLowHand(
  cards: string[],
  rankValues: Record<string, number>
): { cards: string[]; valid: boolean } {
  const ranks = cards.map((c) => c[0])
  const values = ranks.map((r) => rankValues[r])

  // 检查是否所有牌都 ≤8
  const allUnder8 = values.every((v) => v <= 8)
  if (!allUnder8) {
    return { cards: [], valid: false }
  }

  // 检查是否有对子
  const rankCounts = new Map<number, number>()
  for (const v of values) {
    rankCounts.set(v, (rankCounts.get(v) || 0) + 1)
  }
  const hasPair = Array.from(rankCounts.values()).some((count) => count > 1)
  if (hasPair) {
    return { cards: [], valid: false }
  }

  return { cards, valid: true }
}

/**
 * 比较两手 Low 牌，返回负数表示 hand1 更好（更低）
 */
function compareLowHands(
  hand1: string[],
  hand2: string[],
  rankValues: Record<string, number>
): number {
  const values1 = hand1.map((c) => rankValues[c[0]]).sort((a, b) => b - a) // 从大到小
  const values2 = hand2.map((c) => rankValues[c[0]]).sort((a, b) => b - a)

  for (let i = 0; i < 5; i++) {
    if (values1[i] < values2[i]) return -1 // hand1 更好
    if (values1[i] > values2[i]) return 1 // hand2 更好
  }
  return 0 // 平局
}

/**
 * Lowball 2-7 分数计算函数
 * 计算 5 张牌的 2-7 低牌分数
 * A算14点（最差），顺子和同花会让牌力变差
 * 牌型权重：高牌(0) < 一对(1) < 两对(2) < 三条(3) < 顺子(4) < 同花(5) < 葫芦(6) < 四条(7) < 同花顺(8) < 皇家同花顺(9)
 */
export function getLowball27Score(cards: string[]): { score: number; highCards: number[] } {
  const rankValues: Record<string, number> = {
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    T: 10,
    J: 11,
    Q: 12,
    K: 13,
    A: 14,
  }

  const ranks = cards.map((c) => c[0])
  const suits = cards.map((c) => c.slice(1))
  const values = ranks.map((r) => rankValues[r])

  // 统计每个点数的数量
  const rankCounts = new Map<number, number>()
  for (const v of values) {
    rankCounts.set(v, (rankCounts.get(v) || 0) + 1)
  }

  // 检查是否是同花
  const isFlush = suits.every((s) => s === suits[0])

  // 检查是否是顺子
  const sortedValues = [...values].sort((a, b) => a - b)
  let isStraight = true
  for (let i = 1; i < sortedValues.length; i++) {
    if (sortedValues[i] !== sortedValues[i - 1] + 1) {
      isStraight = false
      break
    }
  }
  // 特殊情况：A-2-3-4-5 顺子（wheel）- 在2-7中这也是顺子
  if (!isStraight && sortedValues.join(',') === '2,3,4,5,14') {
    isStraight = true
  }

  // 判断牌型
  const counts = Array.from(rankCounts.values()).sort((a, b) => b - a)
  let handType = 0 // 0=高牌

  if (isFlush && isStraight) {
    // 检查是否是皇家同花顺 (10-J-Q-K-A)
    if (sortedValues.join(',') === '10,11,12,13,14') {
      handType = 9 // 皇家同花顺
    } else {
      handType = 8 // 同花顺
    }
  } else if (counts[0] === 4) {
    handType = 7 // 四条
  } else if (counts[0] === 3 && counts[1] === 2) {
    handType = 6 // 葫芦
  } else if (isFlush) {
    handType = 5 // 同花
  } else if (isStraight) {
    handType = 4 // 顺子
  } else if (counts[0] === 3) {
    handType = 3 // 三条
  } else if (counts[0] === 2 && counts[1] === 2) {
    handType = 2 // 两对
  } else if (counts[0] === 2) {
    handType = 1 // 一对
  }

  // 根据不同牌型确定正确的高牌比较顺序
  let highCards: number[]
  if (handType === 1) { // 一对
    const pairRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 2)![0]
    const otherRanks = Array.from(rankCounts.entries()).filter(([_, count]) => count === 1).map(([rank]) => rank).sort((a, b) => b - a)
    highCards = [pairRank, ...otherRanks]
  } else if (handType === 2) { // 两对
    const pairRanks = Array.from(rankCounts.entries()).filter(([_, count]) => count === 2).map(([rank]) => rank).sort((a, b) => b - a)
    const singleRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 1)![0]
    highCards = [...pairRanks, singleRank]
  } else if (handType === 3) { // 三条
    const threeRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 3)![0]
    const otherRanks = Array.from(rankCounts.entries()).filter(([_, count]) => count === 1).map(([rank]) => rank).sort((a, b) => b - a)
    highCards = [threeRank, ...otherRanks]
  } else if (handType === 4 || handType === 8) { // 顺子或同花顺
    // 顺子比较最高牌
    highCards = [Math.max(...values)]
  } else if (handType === 5) { // 同花
    highCards = values.sort((a, b) => b - a)
  } else if (handType === 6) { // 葫芦
    const threeRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 3)![0]
    const pairRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 2)![0]
    highCards = [threeRank, pairRank]
  } else if (handType === 7) { // 四条
    const fourRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 4)![0]
    const singleRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 1)![0]
    highCards = [fourRank, singleRank]
  } else if (handType === 9) { // 皇家同花顺
    highCards = [14] // 最高牌是A
  } else { // 高牌
    highCards = values.sort((a, b) => b - a)
  }

  // 将高牌值编码到分数中
  let highCardValue = 0
  highCards.forEach((card, index) => {
    highCardValue += card * Math.pow(16, highCards.length - 1 - index)
  })

  return { score: handType * 1000000 + highCardValue, highCards }
}

/**
 * 获取 Lowball 2-7 模式下的手牌信息
 */
function getLowball27Hand(cards: string[]): { cards: string[]; score: number; highCards: number[] } {
  const solverCards = cards.map(toSolverCard)
  const scoreResult = getLowball27Score(solverCards)
  return { cards: solverCards, ...scoreResult }
}

/**
 * 比较两手 Lowball 2-7 牌的高牌（从大到小比较，高牌越低越好）
 */
function compareLowball27HighCards(hand1: number[], hand2: number[]): number {
  for (let i = 0; i < hand1.length; i++) {
    if (hand1[i] < hand2[i]) return -1 // hand1 更好
    if (hand1[i] > hand2[i]) return 1 // hand2 更好
  }
  return 0 // 平局
}

/**
 * 5 Card Lowball 2-7 手牌读取器
 * 输入：2-8个手牌，每个手牌5张牌
 * 输出：胜利者信息（座位号、手牌对象、牌型描述）
 *
 * 牌力规则（从强到弱，即越低越好）：
 * 高牌(0) < 一对(1) < 两对(2) < 三条(3) < 顺子(4) < 同花(5) < 葫芦(6) < 四条(7) < 同花顺(8) < 皇家同花顺(9)
 * A算14点（最差的牌）
 * 相同牌型比较高牌（从大到小比较，高牌越低越好）
 */
export function read5Card27LowHands(
  playerHands: PlayerHands
): WinnerResult {
  const handTypeDescriptions = [
    'High Card',
    'One Pair',
    'Two Pair',
    'Three of a Kind',
    'Straight',
    'Flush',
    'Full House',
    'Four of a Kind',
    'Straight Flush',
    'Royal Flush'
  ]

  // 计算每个玩家的 Lowball 2-7 手牌
  const solvedLowball = Object.entries(playerHands).map(([seat, cards]) => {
    const lowballHand = getLowball27Hand(cards)
    return {
      seat: Number(seat),
      lowballHand,
    }
  })

  // 找出最好的 Lowball 2-7 牌
  let bestLowball = solvedLowball[0]
  for (const player of solvedLowball) {
    if (
      player.lowballHand.score < bestLowball.lowballHand.score ||
      (player.lowballHand.score === bestLowball.lowballHand.score &&
        compareLowball27HighCards(player.lowballHand.highCards, bestLowball.lowballHand.highCards) < 0)
    ) {
      bestLowball = player
    }
  }

  // 找出所有平局的玩家
  const winnerSeats = solvedLowball
    .filter(
      (p) =>
        p.lowballHand.score === bestLowball.lowballHand.score &&
        compareLowball27HighCards(p.lowballHand.highCards, bestLowball.lowballHand.highCards) === 0
    )
    .map((p) => p.seat)
    .sort((a, b) => a - b)

  const winnerHands = solvedLowball
    .filter((p) => winnerSeats.includes(p.seat))
    .map((p) => {
      const handType = Math.floor(p.lowballHand.score / 1000000)
      const handDescription = handTypeDescriptions[handType]
      return {
        cards: p.lowballHand.cards,
        score: p.lowballHand.score,
        highCards: p.lowballHand.highCards,
        descr: `${handDescription}: ${p.lowballHand.cards.join(' ')}`,
      }
    })

  const bestHandType = Math.floor(bestLowball.lowballHand.score / 1000000)
  const bestHandDescription = handTypeDescriptions[bestHandType]
  const bestHandDescr = `${bestHandDescription}: ${bestLowball.lowballHand.cards.join(' ')}`

  return {
    seats: winnerSeats,
    hands: winnerHands,
    descr: bestHandDescr,
  }
}

/**
 * 7 Card Stud 2-7 Low 手牌读取器（无限制）
 * 输入：2-8个手牌，每个手牌7张牌
 * 输出：胜利者信息（座位号、手牌对象、牌型描述）
 *
 * 牌力规则：从7张牌中选5张最好的2-7 Low牌型
 * A算14点，顺子和同花会让牌力变差
 */
export function read7CardHandLow27(
  playerHands: PlayerHands,
  playerStudCards: Record<number, Card[]> = {}
): WinnerResult {
  // 计算每个玩家的最佳 Low 牌（7张牌中选5张）
  const solvedPlayers = Object.entries(playerHands).map(([seat, cards]) => {
    const seatNum = Number(seat)
    const allCards = [...cards, ...(playerStudCards[seatNum] || [])]
    const allCombinations = combinations(allCards, 5)

    // 找出最佳的5张牌组合
    let bestLowHand = getLowball27Hand(allCombinations[0])
    for (let i = 1; i < allCombinations.length; i++) {
      const currentHand = getLowball27Hand(allCombinations[i])
      if (
        currentHand.score < bestLowHand.score ||
        (currentHand.score === bestLowHand.score &&
          compareLowball27HighCards(currentHand.highCards, bestLowHand.highCards) < 0)
      ) {
        bestLowHand = currentHand
      }
    }

    return {
      seat: seatNum,
      lowballHand: bestLowHand,
    }
  })

  // 找出最好的 Lowball 2-7 牌
  let bestLowball = solvedPlayers[0]
  for (const player of solvedPlayers) {
    if (
      player.lowballHand.score < bestLowball.lowballHand.score ||
      (player.lowballHand.score === bestLowball.lowballHand.score &&
        compareLowball27HighCards(player.lowballHand.highCards, bestLowball.lowballHand.highCards) < 0)
    ) {
      bestLowball = player
    }
  }

  // 找出所有平局的玩家
  const winnerSeats = solvedPlayers
    .filter(
      (p) =>
        p.lowballHand.score === bestLowball.lowballHand.score &&
        compareLowball27HighCards(p.lowballHand.highCards, bestLowball.lowballHand.highCards) === 0
    )
    .map((p) => p.seat)
    .sort((a, b) => a - b)

  const handTypeDescriptions = [
    'High Card',
    'One Pair',
    'Two Pair',
    'Three of a Kind',
    'Straight',
    'Flush',
    'Full House',
    'Four of a Kind',
    'Straight Flush',
    'Royal Flush'
  ]

  const winnerHands = solvedPlayers
    .filter((p) => winnerSeats.includes(p.seat))
    .map((p) => {
      const handType = Math.floor(p.lowballHand.score / 1000000)
      const handDescription = handTypeDescriptions[handType]
      return {
        cards: p.lowballHand.cards,
        score: p.lowballHand.score,
        highCards: p.lowballHand.highCards,
        descr: `${handDescription}: ${p.lowballHand.cards.join(' ')}`,
      }
    })

  const bestHandType = Math.floor(bestLowball.lowballHand.score / 1000000)
  const bestHandDescription = handTypeDescriptions[bestHandType]
  const bestHandDescr = `${bestHandDescription}: ${bestLowball.lowballHand.cards.join(' ')}`

  return {
    seats: winnerSeats,
    hands: winnerHands,
    descr: bestHandDescr,
  }
}

/**
 * Badugi 手牌结果接口
 */
export interface BadugiHandResult {
  validCards: string[]
  count: number
  ranks: number[]
}

/**
 * Badugi 赢家结果接口
 */
export interface BadugiWinnerResult {
  seats: number[]
  hands: BadugiHandResult[]
  descr: string
}

/**
 * 计算单手 Badugi 牌的最佳组合（A-5 规则，A=1）
 */
function getBadugiHandA5(cards: string[]): BadugiHandResult {
  const rankValues: Record<string, number> = {
    A: 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
    '8': 8, '9': 9, T: 10, J: 11, Q: 12, K: 13,
  }

  const solverCards = cards.map(toSolverCard)
  const sortedCards = solverCards
    .map((c) => ({ card: c, rank: c[0], suit: c[1], value: rankValues[c[0]] }))
    .sort((a, b) => a.value - b.value)

  const validCards: string[] = []
  const usedRanks = new Set<string>()
  const usedSuits = new Set<string>()

  for (const cardInfo of sortedCards) {
    if (!usedRanks.has(cardInfo.rank) && !usedSuits.has(cardInfo.suit)) {
      validCards.push(cardInfo.card)
      usedRanks.add(cardInfo.rank)
      usedSuits.add(cardInfo.suit)
    }
  }

  const ranks = validCards.map((c) => rankValues[c[0]]).sort((a, b) => b - a)
  return { validCards, count: validCards.length, ranks }
}

/**
 * 计算单手 Badugi 2-7 牌的最佳组合（A=14）
 */
function getBadugiHand27(cards: string[]): BadugiHandResult {
  const rankValues: Record<string, number> = {
    A: 14, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
    '8': 8, '9': 9, T: 10, J: 11, Q: 12, K: 13,
  }

  const solverCards = cards.map(toSolverCard)
  const sortedCards = solverCards
    .map((c) => ({ card: c, rank: c[0], suit: c[1], value: rankValues[c[0]] }))
    .sort((a, b) => a.value - b.value)

  const validCards: string[] = []
  const usedRanks = new Set<string>()
  const usedSuits = new Set<string>()

  for (const cardInfo of sortedCards) {
    if (!usedRanks.has(cardInfo.rank) && !usedSuits.has(cardInfo.suit)) {
      validCards.push(cardInfo.card)
      usedRanks.add(cardInfo.rank)
      usedSuits.add(cardInfo.suit)
    }
  }

  const ranks = validCards.map((c) => rankValues[c[0]]).sort((a, b) => b - a)
  return { validCards, count: validCards.length, ranks }
}

/**
 * 比较两手 Badugi 牌，返回负数表示 hand1 更好
 */
function compareBadugiHands(hand1: BadugiHandResult, hand2: BadugiHandResult): number {
  if (hand1.count > hand2.count) return -1
  if (hand1.count < hand2.count) return 1
  for (let i = 0; i < hand1.count; i++) {
    if (hand1.ranks[i] < hand2.ranks[i]) return -1
    if (hand1.ranks[i] > hand2.ranks[i]) return 1
  }
  return 0
}

/**
 * Badugi 手牌读取器（A-5 规则，A=1）
 * 输入：2-8个玩家手牌，每手4张或5张牌
 */
export function readBadugiHands(playerHands: PlayerHands): BadugiWinnerResult {
  const solvedPlayers = Object.entries(playerHands).map(([seat, cards]) => {
    const seatNum = Number(seat)
    let bestBadugi: BadugiHandResult
    if (cards.length <= 4) {
      bestBadugi = getBadugiHandA5(cards)
    } else {
      const allCombinations = combinations(cards, 4)
      bestBadugi = getBadugiHandA5(allCombinations[0])
      for (let i = 1; i < allCombinations.length; i++) {
        const currentHand = getBadugiHandA5(allCombinations[i])
        if (compareBadugiHands(currentHand, bestBadugi) < 0) {
          bestBadugi = currentHand
        }
      }
    }
    return { seat: seatNum, badugiHand: bestBadugi }
  })

  let bestBadugi = solvedPlayers[0]
  for (const player of solvedPlayers) {
    if (compareBadugiHands(player.badugiHand, bestBadugi.badugiHand) < 0) {
      bestBadugi = player
    }
  }

  const winnerSeats = solvedPlayers
    .filter((p) => compareBadugiHands(p.badugiHand, bestBadugi.badugiHand) === 0)
    .map((p) => p.seat)
    .sort((a, b) => a - b)

  const winnerHands = solvedPlayers
    .filter((p) => winnerSeats.includes(p.seat))
    .map((p) => p.badugiHand)

  const cardCount = bestBadugi.badugiHand.count
  const cardType = cardCount === 4 ? 'Badugi' : `${cardCount}-card`
  const descr = `${cardType}: ${bestBadugi.badugiHand.validCards.join(' ')}`

  return { seats: winnerSeats, hands: winnerHands, descr }
}

/**
 * Badugi 2-7 手牌读取器（A=14）
 * 输入：2-8个玩家手牌，每手4张或5张牌
 */
export function readBadugiHands27(playerHands: PlayerHands): BadugiWinnerResult {
  const solvedPlayers = Object.entries(playerHands).map(([seat, cards]) => {
    const seatNum = Number(seat)
    let bestBadugi: BadugiHandResult
    if (cards.length <= 4) {
      bestBadugi = getBadugiHand27(cards)
    } else {
      const allCombinations = combinations(cards, 4)
      bestBadugi = getBadugiHand27(allCombinations[0])
      for (let i = 1; i < allCombinations.length; i++) {
        const currentHand = getBadugiHand27(allCombinations[i])
        if (compareBadugiHands(currentHand, bestBadugi) < 0) {
          bestBadugi = currentHand
        }
      }
    }
    return { seat: seatNum, badugiHand: bestBadugi }
  })

  let bestBadugi = solvedPlayers[0]
  for (const player of solvedPlayers) {
    if (compareBadugiHands(player.badugiHand, bestBadugi.badugiHand) < 0) {
      bestBadugi = player
    }
  }

  const winnerSeats = solvedPlayers
    .filter((p) => compareBadugiHands(p.badugiHand, bestBadugi.badugiHand) === 0)
    .map((p) => p.seat)
    .sort((a, b) => a - b)

  const winnerHands = solvedPlayers
    .filter((p) => winnerSeats.includes(p.seat))
    .map((p) => p.badugiHand)

  const cardCount = bestBadugi.badugiHand.count
  const cardType = cardCount === 4 ? 'Badugi' : `${cardCount}-card`
  const descr = `${cardType}: ${bestBadugi.badugiHand.validCards.join(' ')}`

  return { seats: winnerSeats, hands: winnerHands, descr }
}

/**
 * 7 Card Badugi A-5 手牌读取器
 * 输入：所有玩家手牌对象（每个玩家7张牌）
 * 输出：胜利者信息（座位号、手牌对象、牌型描述）
 * 从7张牌中选出最好的4张Badugi
 */
export function read7CardBadugiA5(
  playerHands: PlayerHands,
  playerStudCards: Record<number, Card[]> = {}
): BadugiWinnerResult {
  // 将每个玩家的7张牌合并，然后找出最好的4张Badugi
  const combinedHands: PlayerHands = {}
  for (const [seat, cards] of Object.entries(playerHands)) {
    const seatNum = Number(seat)
    combinedHands[seatNum] = [...cards, ...(playerStudCards[seatNum] || [])]
  }

  // 调用 readBadugiHands，它会自动从多于4张的牌中选出最好的4张
  return readBadugiHands(combinedHands)
}

/**
 * 7 Card Badugi 2-7 手牌读取器
 * 输入：所有玩家手牌对象（每个玩家7张牌）
 * 输出：胜利者信息（座位号、手牌对象、牌型描述）
 * 从7张牌中选出最好的4张Badugi（A=14）
 */
export function read7CardBadugi27(
  playerHands: PlayerHands,
  playerStudCards: Record<number, Card[]> = {}
): BadugiWinnerResult {
  // 将每个玩家的7张牌合并，然后找出最好的4张Badugi
  const combinedHands: PlayerHands = {}
  for (const [seat, cards] of Object.entries(playerHands)) {
    const seatNum = Number(seat)
    combinedHands[seatNum] = [...cards, ...(playerStudCards[seatNum] || [])]
  }

  // 调用 readBadugiHands27，它会自动从多于4张的牌中选出最好的4张（A=14）
  return readBadugiHands27(combinedHands)
}

export function readOmahaHandLowA5(
  board: Card[],
  playerHands: PlayerHands
): WinnerResult {
  const rankValues: Record<string, number> = {
    A: 1,
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    T: 10,
    J: 11,
    Q: 12,
    K: 13,
  }

  // 计算每个玩家的最佳 Low 牌
  const solvedPlayers: LowHandResult[] = Object.entries(playerHands).map(([seat, cards]) => {
    const holeCombos = combinations(cards, 2)
    const boardCombos = combinations(board, 3)

    let bestLow: string[] | null = null

    for (const hole of holeCombos) {
      for (const boardPart of boardCombos) {
        const combo = [...hole, ...boardPart].map(toSolverCard)
        const lowResult = checkLowHand(combo, rankValues)
        if (lowResult.valid) {
          if (!bestLow || compareLowHands(lowResult.cards, bestLow, rankValues) < 0) {
            bestLow = lowResult.cards
          }
        }
      }
    }

    return {
      seat: Number(seat),
      cards: bestLow || [],
      valid: !!bestLow,
    }
  })

  // 找出有效的 Low 牌
  const validLowPlayers = solvedPlayers.filter((s) => s.valid)

  if (validLowPlayers.length === 0) {
    return {
      seats: [],
      hands: [],
      descr: 'No qualifying low',
    }
  }

  // 找出最好的 Low 牌
  let bestLow = validLowPlayers[0]
  for (const player of validLowPlayers) {
    if (compareLowHands(player.cards, bestLow.cards, rankValues) < 0) {
      bestLow = player
    }
  }

  // 找出所有平局的玩家
  const winnerSeats = validLowPlayers
    .filter((p) => compareLowHands(p.cards, bestLow.cards, rankValues) === 0)
    .map((p) => p.seat)
    .sort((a, b) => a - b)

  const winnerHands = validLowPlayers
    .filter((p) => winnerSeats.includes(p.seat))
    .map((p) => ({
      cards: p.cards,
      descr: p.cards.join(' '),
    }))

  return {
    seats: winnerSeats,
    hands: winnerHands,
    descr: bestLow.cards.join(' '),
  }
}

