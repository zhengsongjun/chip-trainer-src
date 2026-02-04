

/**
 * Lowball 2-7 分数计算函数
 * 计算 5 张牌的 Lowball 2-7 分数（越小越好）
 * 规则：A算14点，顺子和同花让牌力变差，对子、两对、三条、顺子、同花、葫芦、四条、同花顺一个比一个差
 * 牌型权重：高牌(0) < 一对(1) < 两对(2) < 三条(3) < 顺子(4) < 同花(5) < 葫芦(6) < 四条(7) < 同花顺(8)
 */
function get27LowScore(cards: string[]): { score: number; highCards: number[] } {
  const rankValues: Record<string, number> = {
    A: 14,
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    T: 10,
    J: 11,
    Q: 12,
    K: 13,
  }

  const ranks = cards.map((c) => c[0])
  const suits = cards.map((c) => c[1])
  const values = ranks.map((r) => rankValues[r])

  // 统计每个点数的数量
  const rankCounts = new Map<number, number>()
  for (const v of values) {
    rankCounts.set(v, (rankCounts.get(v) || 0) + 1)
  }

  // 判断是否同花
  const isFlush = suits.every((s) => s === suits[0])

  // 判断是否顺子
  const sortedValues = [...values].sort((a, b) => a - b)
  const isStraight = sortedValues.every((v, i) => {
    if (i === 0) return true
    return v === sortedValues[i - 1] + 1
  })

  // 判断牌型
  const counts = Array.from(rankCounts.values()).sort((a, b) => b - a)
  let handType = 0 // 0=高牌

  if (isFlush && isStraight)
    handType = 8 // 同花顺
  else if (counts[0] === 4)
    handType = 7 // 四条
  else if (counts[0] === 3 && counts[1] === 2)
    handType = 6 // 葫芦
  else if (isFlush)
    handType = 5 // 同花
  else if (isStraight)
    handType = 4 // 顺子
  else if (counts[0] === 3)
    handType = 3 // 三条
  else if (counts[0] === 2 && counts[1] === 2)
    handType = 2 // 两对
  else if (counts[0] === 2) handType = 1 // 一对

  // 获取高牌（从大到小排序）
  const highCards = values.sort((a, b) => b - a)

  // 将高牌值编码到分数中，使分数可以直接比较
  // 每个高牌占4位（最大14），5张牌需要20位，乘以牌型权重后相加
  let highCardValue = 0
  highCards.forEach((card, index) => {
    highCardValue += card * Math.pow(16, highCards.length - 1 - index)
  })

  // 牌型权重 * 1000000，然后加上高牌比较
  return { score: handType * 1000000 + highCardValue, highCards }
}

/**
 * 获取 Lowball 2-7 模式下的最佳 Low 牌（直接使用5张手牌）
 */
function getLowball27Hand(cards: string[]): { cards: string[]; score: number; highCards: number[] } {
  const solverCards = cards.map(toSolverCard)
  const scoreResult = get27LowScore(solverCards)
  return { cards: solverCards, ...scoreResult }
}

/**
 * 5 Card Lowball 2-7 手牌读取器
 * 输入：2-8个手牌，每个手牌5张牌
 * 输出：胜利者信息（座位号、手牌对象、牌型描述）
 */
export function read5Card27LowHands(
  playerHands: PlayerHands
): WinnerResult {
  const handTypeDescriptions = [
    "High Card",
    "One Pair",
    "Two Pair",
    "Three of a Kind",
    "Straight",
    "Flush",
    "Full House",
    "Four of a Kind",
    "Straight Flush"
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
        descr: `${handDescription}: ${p.lowballHand.cards.join(" ")}`,
      }
    })

  const bestHandType = Math.floor(bestLowball.lowballHand.score / 1000000)
  const bestHandDescription = handTypeDescriptions[bestHandType]
  const bestHandDescr = `${bestHandDescription}: ${bestLowball.lowballHand.cards.join(" ")}`

  return {
    seats: winnerSeats,
    hands: winnerHands,
    descr: bestHandDescr,
  }
}

/**
 * 7 Card Stud Lowball 2-7 手牌读取器（无8/Better限制）
 * 输入：2-8个手牌，每个手牌7张牌
 * 输出：胜利者信息（座位号、手牌对象、牌型描述）
 */
export function read7CardHandLow27Regular(
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

  // 找出最好的 Lowball 2-7 牌
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
    "High Card",
    "One Pair",
    "Two Pair",
    "Three of a Kind",
    "Straight",
    "Flush",
    "Full House",
    "Four of a Kind",
    "Straight Flush"
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
        descr: `${handDescription}: ${p.lowballHand.cards.join(" ")}`,
      }
    })

  const bestHandType = Math.floor(bestLowball.lowballHand.score / 1000000)
  const bestHandDescription = handTypeDescriptions[bestHandType]
  const bestHandDescr = `${bestHandDescription}: ${bestLowball.lowballHand.cards.join(" ")}`

  return {
    seats: winnerSeats,
    hands: winnerHands,
    descr: bestHandDescr,
  }
}
