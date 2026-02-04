/**
 * Test for Razz 2-7 Low hand reading
 * Uses CommonJS require to work with pokersolver
 */

const pokersolver = require('pokersolver')

// Replicate the getLowball27Score logic from PokerHandReader.ts
const rankValues = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
}

function getLowball27Score(cards) {
  const ranks = cards.map(c => c[0])
  const suits = cards.map(c => c[1])
  const values = ranks.map(r => rankValues[r])

  const rankCounts = new Map()
  for (const v of values) {
    rankCounts.set(v, (rankCounts.get(v) || 0) + 1)
  }

  const isFlush = suits.every(s => s === suits[0])

  const sortedValues = [...values].sort((a, b) => a - b)
  let isStraight = true
  for (let i = 1; i < sortedValues.length; i++) {
    if (sortedValues[i] !== sortedValues[i - 1] + 1) {
      isStraight = false
      break
    }
  }
  const isWheel = sortedValues.join(',') === '2,3,4,5,14'
  if (isWheel) isStraight = true

  const counts = Array.from(rankCounts.values()).sort((a, b) => b - a)
  let handType = 0

  if (isFlush && isStraight) {
    if (sortedValues.join(',') === '10,11,12,13,14') {
      handType = 9
    } else {
      handType = 8
    }
  } else if (counts[0] === 4) {
    handType = 7
  } else if (counts[0] === 3 && counts[1] === 2) {
    handType = 6
  } else if (isFlush) {
    handType = 5
  } else if (isStraight) {
    handType = 4
  } else if (counts[0] === 3) {
    handType = 3
  } else if (counts[0] === 2 && counts[1] === 2) {
    handType = 2
  } else if (counts[0] === 2) {
    handType = 1
  }

  const highCards = [...values].sort((a, b) => b - a)
  return { score: handType * 1000000, highCards, handType }
}

function compareLowball27HighCards(hand1, hand2) {
  for (let i = 0; i < 5; i++) {
    if (hand1[i] < hand2[i]) return -1
    if (hand1[i] > hand2[i]) return 1
  }
  return 0
}

function combinations(arr, k) {
  const result = []
  function combine(start, combo) {
    if (combo.length === k) {
      result.push([...combo])
      return
    }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i])
      combine(i + 1, combo)
      combo.pop()
    }
  }
  combine(0, [])
  return result
}

function getLowball27Hand(cards) {
  const cardStrings = cards.map(c => typeof c === 'string' ? c : `${c.rank === '10' ? 'T' : c.rank}${c.suit[0]}`)
  const result = getLowball27Score(cardStrings)
  return { cards: cardStrings, ...result }
}

// Simulate read7CardHandLow27
function read7CardHandLow27(playerHands, playerStudCards = {}) {
  const solvedPlayers = Object.entries(playerHands).map(([seat, cards]) => {
    const seatNum = Number(seat)
    const allCards = [...cards, ...(playerStudCards[seatNum] || [])]
    const allCombinations = combinations(allCards, 5)

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

    return { seat: seatNum, lowballHand: bestLowHand }
  })

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

  const winnerSeats = solvedPlayers
    .filter(p =>
      p.lowballHand.score === bestLowball.lowballHand.score &&
      compareLowball27HighCards(p.lowballHand.highCards, bestLowball.lowballHand.highCards) === 0
    )
    .map(p => p.seat)
    .sort((a, b) => a - b)

  const handTypeDescriptions = [
    'High Card', 'One Pair', 'Two Pair', 'Three of a Kind', 'Straight',
    'Flush', 'Full House', 'Four of a Kind', 'Straight Flush', 'Royal Flush'
  ]

  const bestHandType = Math.floor(bestLowball.lowballHand.score / 1000000)
  const bestHandDescr = `${handTypeDescriptions[bestHandType]}: ${bestLowball.lowballHand.cards.join(' ')}`

  return { seats: winnerSeats, descr: bestHandDescr }
}

// Helper to create card objects
function card(str) {
  const rankMap = { 'T': '10' }
  const suitMap = { 'h': 'hearts', 'd': 'diamonds', 'c': 'clubs', 's': 'spades' }
  return {
    rank: rankMap[str[0]] || str[0],
    suit: suitMap[str[1]]
  }
}

console.log('=== Razz 2-7 Low Integration Tests ===\n')

let passed = 0, failed = 0

// Test 1: Basic winner selection
console.log('Test 1: 7-high beats 8-high')
{
  const playerHands = {
    1: [card('7h'), card('5c'), card('4d')],
    2: [card('8h'), card('5s'), card('4c')]
  }
  const playerStudCards = {
    1: [card('3s'), card('2h'), card('Kc'), card('Qd')],
    2: [card('3d'), card('2c'), card('Kh'), card('Qs')]
  }
  const result = read7CardHandLow27(playerHands, playerStudCards)

  if (result.seats.length === 1 && result.seats[0] === 1) {
    console.log('✓ PASS'); passed++
  } else {
    console.log('✗ FAIL: Expected seat 1'); failed++
  }
  console.log(`  Result: ${JSON.stringify(result)}\n`)
}

// Test 2: Tie detection
console.log('Test 2: Tie detection')
{
  const playerHands = {
    1: [card('7h'), card('5c'), card('4d')],
    2: [card('7s'), card('5d'), card('4h')]
  }
  const playerStudCards = {
    1: [card('3s'), card('2h'), card('Kc'), card('Qd')],
    2: [card('3c'), card('2d'), card('Kh'), card('Qs')]
  }
  const result = read7CardHandLow27(playerHands, playerStudCards)

  if (result.seats.length === 2) {
    console.log('✓ PASS'); passed++
  } else {
    console.log('✗ FAIL: Expected tie'); failed++
  }
  console.log(`  Result: ${JSON.stringify(result)}\n`)
}

// Test 3: High Card beats Pair (force pair by giving only paired cards)
console.log('Test 3: High Card beats Pair')
{
  // Player 1 must use pair (all cards have pairs)
  const playerHands = {
    1: [card('7h'), card('7c'), card('4d')],
    2: [card('Ah'), card('Kc'), card('Qd')]
  }
  const playerStudCards = {
    1: [card('4s'), card('3h'), card('3c'), card('2d')],  // Forces pair (7-7 or 4-4 or 3-3)
    2: [card('Jh'), card('9s'), card('8c'), card('2s')]
  }
  const result = read7CardHandLow27(playerHands, playerStudCards)

  if (result.seats[0] === 2) {
    console.log('✓ PASS'); passed++
  } else {
    console.log('✗ FAIL: Expected seat 2 (High Card)'); failed++
  }
  console.log(`  Result: ${JSON.stringify(result)}\n`)
}

// Test 4: Straight is bad in 2-7
console.log('Test 4: 7-high beats Straight (6-5-4-3-2)')
{
  const playerHands = {
    1: [card('6h'), card('5c'), card('4d')],  // Will make straight
    2: [card('7h'), card('5d'), card('4c')]   // 7-high
  }
  const playerStudCards = {
    1: [card('3s'), card('2h'), card('Kc'), card('Qd')],
    2: [card('3s'), card('2c'), card('Kh'), card('Qs')]
  }
  const result = read7CardHandLow27(playerHands, playerStudCards)

  if (result.seats[0] === 2) {
    console.log('✓ PASS'); passed++
  } else {
    console.log('✗ FAIL: Expected seat 2 (7-high)'); failed++
  }
  console.log(`  Result: ${JSON.stringify(result)}\n`)
}

// Test 5: Wheel (A-5) is a Straight in 2-7
console.log('Test 5: Wheel (A-2-3-4-5) is a Straight in 2-7')
{
  const playerHands = {
    1: [card('Ah'), card('2c'), card('3d')],  // Wheel = Straight
    2: [card('7h'), card('5d'), card('4c')]   // 7-high
  }
  const playerStudCards = {
    1: [card('4s'), card('5h'), card('Kc'), card('Qd')],
    2: [card('3s'), card('2c'), card('Kh'), card('Qs')]
  }
  const result = read7CardHandLow27(playerHands, playerStudCards)

  if (result.seats[0] === 2) {
    console.log('✓ PASS'); passed++
  } else {
    console.log('✗ FAIL: Expected seat 2 (7-high beats wheel)'); failed++
  }
  console.log(`  Result: ${JSON.stringify(result)}\n`)
}

// Test 6: Flush is bad in 2-7
console.log('Test 6: High Card beats Flush')
{
  const playerHands = {
    1: [card('7h'), card('5h'), card('4h')],  // All hearts
    2: [card('Kc'), card('Qd'), card('Js')]   // Mixed suits
  }
  const playerStudCards = {
    1: [card('3h'), card('2h'), card('Ac'), card('Ad')],  // Flush
    2: [card('9h'), card('8c'), card('7d'), card('6s')]   // No flush
  }
  const result = read7CardHandLow27(playerHands, playerStudCards)

  if (result.seats[0] === 2) {
    console.log('✓ PASS'); passed++
  } else {
    console.log('✗ FAIL: Expected seat 2 (High Card beats Flush)'); failed++
  }
  console.log(`  Result: ${JSON.stringify(result)}\n`)
}

console.log('=== Summary ===')
console.log(`Passed: ${passed}/${passed + failed}`)

if (failed === 0) {
  console.log('\n✓ All tests passed!')
} else {
  console.log(`\n✗ ${failed} test(s) failed!`)
  process.exit(1)
}
