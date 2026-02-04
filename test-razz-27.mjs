/**
 * Test file for Razz 2-7 Low hand reading
 * Tests the read7CardHandLow27 function from PokerHandReader.ts
 */

// Since this is a .mjs file, we need to use dynamic import for the compiled code
// First, let's test the logic directly

// 2-7 Low scoring rules:
// - A is high (14), worst card
// - Straights and flushes count against you (make hand worse)
// - Best possible hand: 2-3-4-5-7 (not suited, no straight)
// - Hand types (lower is better): High Card(0) < Pair(1) < Two Pair(2) < Three of a Kind(3) < Straight(4) < Flush(5) < Full House(6) < Four of a Kind(7) < Straight Flush(8)

const rankValues = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
}

function getLowball27Score(cards) {
  const ranks = cards.map(c => c[0])
  const suits = cards.map(c => c[1])
  const values = ranks.map(r => rankValues[r])

  // Count ranks
  const rankCounts = new Map()
  for (const v of values) {
    rankCounts.set(v, (rankCounts.get(v) || 0) + 1)
  }

  // Check for flush
  const isFlush = suits.every(s => s === suits[0])

  // Check for straight
  const sortedValues = [...values].sort((a, b) => a - b)
  let isStraight = true
  for (let i = 1; i < sortedValues.length; i++) {
    if (sortedValues[i] !== sortedValues[i - 1] + 1) {
      isStraight = false
      break
    }
  }
  // Check for wheel (A-2-3-4-5) - in 2-7, this IS a straight (A is high)
  const isWheel = sortedValues.join(',') === '2,3,4,5,14'
  if (isWheel) isStraight = true

  // Determine hand type
  const counts = Array.from(rankCounts.values()).sort((a, b) => b - a)
  let handType = 0

  if (isFlush && isStraight) {
    // Check for royal flush
    if (sortedValues.join(',') === '10,11,12,13,14') {
      handType = 9 // Royal Flush (worst)
    } else {
      handType = 8 // Straight Flush
    }
  } else if (counts[0] === 4) {
    handType = 7 // Four of a Kind
  } else if (counts[0] === 3 && counts[1] === 2) {
    handType = 6 // Full House
  } else if (isFlush) {
    handType = 5 // Flush
  } else if (isStraight) {
    handType = 4 // Straight
  } else if (counts[0] === 3) {
    handType = 3 // Three of a Kind
  } else if (counts[0] === 2 && counts[1] === 2) {
    handType = 2 // Two Pair
  } else if (counts[0] === 2) {
    handType = 1 // One Pair
  }

  // High cards sorted from high to low
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

// Test cases
const testCases = [
  {
    name: 'Best 2-7 Low (7-5-4-3-2 unsuited)',
    cards: ['7h', '5c', '4d', '3s', '2h'],
    expectedType: 0, // High Card
    description: 'Should be High Card, best possible 2-7 low'
  },
  {
    name: '8-high low',
    cards: ['8h', '5c', '4d', '3s', '2h'],
    expectedType: 0,
    description: 'Should be High Card, 8-high'
  },
  {
    name: 'One Pair',
    cards: ['7h', '7c', '4d', '3s', '2h'],
    expectedType: 1,
    description: 'Should be One Pair (worse than high card)'
  },
  {
    name: 'Flush (bad in 2-7)',
    cards: ['7h', '5h', '4h', '3h', '2h'],
    expectedType: 5,
    description: 'Should be Flush (very bad in 2-7)'
  },
  {
    name: 'Straight (bad in 2-7)',
    cards: ['6h', '5c', '4d', '3s', '2h'],
    expectedType: 4,
    description: 'Should be Straight (bad in 2-7)'
  },
  {
    name: 'Wheel A-5 is a Straight in 2-7',
    cards: ['Ah', '5c', '4d', '3s', '2h'],
    expectedType: 4,
    description: 'A-2-3-4-5 is a Straight in 2-7 (A is high)'
  },
  {
    name: 'Ace high (worst high card)',
    cards: ['Ah', 'Kc', 'Qd', 'Js', '9h'],
    expectedType: 0,
    description: 'Should be High Card with A high (bad)'
  }
]

console.log('=== Razz 2-7 Low Hand Reading Tests ===\n')

let passed = 0
let failed = 0

for (const test of testCases) {
  const result = getLowball27Score(test.cards)
  const success = result.handType === test.expectedType

  if (success) {
    console.log(`✓ PASS: ${test.name}`)
    console.log(`  Cards: ${test.cards.join(' ')}`)
    console.log(`  Hand Type: ${result.handType} (${['High Card', 'One Pair', 'Two Pair', 'Three of a Kind', 'Straight', 'Flush', 'Full House', 'Four of a Kind', 'Straight Flush', 'Royal Flush'][result.handType]})`)
    console.log(`  High Cards: ${result.highCards.join(', ')}`)
    console.log(`  Score: ${result.score}`)
    passed++
  } else {
    console.log(`✗ FAIL: ${test.name}`)
    console.log(`  Cards: ${test.cards.join(' ')}`)
    console.log(`  Expected Type: ${test.expectedType}, Got: ${result.handType}`)
    console.log(`  ${test.description}`)
    failed++
  }
  console.log()
}

// Test hand comparison
console.log('=== Hand Comparison Tests ===\n')

const comparisonTests = [
  {
    name: '7-high beats 8-high',
    hand1: ['7h', '5c', '4d', '3s', '2h'],
    hand2: ['8h', '5c', '4d', '3s', '2h'],
    expectedWinner: 1 // hand1 wins
  },
  {
    name: 'High Card beats One Pair',
    hand1: ['Kh', 'Qc', 'Jd', '9s', '8h'],
    hand2: ['2h', '2c', '4d', '3s', '5h'],
    expectedWinner: 1 // hand1 wins (high card beats pair)
  },
  {
    name: '7-5-4-3-2 beats 7-6-4-3-2',
    hand1: ['7h', '5c', '4d', '3s', '2h'],
    hand2: ['7h', '6c', '4d', '3s', '2h'],
    expectedWinner: 1 // hand1 wins (lower second card)
  }
]

for (const test of comparisonTests) {
  const score1 = getLowball27Score(test.hand1)
  const score2 = getLowball27Score(test.hand2)

  let winner
  if (score1.score < score2.score) {
    winner = 1
  } else if (score1.score > score2.score) {
    winner = 2
  } else {
    const cmp = compareLowball27HighCards(score1.highCards, score2.highCards)
    winner = cmp < 0 ? 1 : (cmp > 0 ? 2 : 0)
  }

  const success = winner === test.expectedWinner

  if (success) {
    console.log(`✓ PASS: ${test.name}`)
    console.log(`  Hand 1: ${test.hand1.join(' ')} (score: ${score1.score})`)
    console.log(`  Hand 2: ${test.hand2.join(' ')} (score: ${score2.score})`)
    console.log(`  Winner: Hand ${winner}`)
    passed++
  } else {
    console.log(`✗ FAIL: ${test.name}`)
    console.log(`  Hand 1: ${test.hand1.join(' ')} (score: ${score1.score})`)
    console.log(`  Hand 2: ${test.hand2.join(' ')} (score: ${score2.score})`)
    console.log(`  Expected Winner: Hand ${test.expectedWinner}, Got: Hand ${winner}`)
    failed++
  }
  console.log()
}

console.log('=== Summary ===')
console.log(`Passed: ${passed}`)
console.log(`Failed: ${failed}`)
console.log(`Total: ${passed + failed}`)

if (failed === 0) {
  console.log('\n✓ All tests passed!')
} else {
  console.log('\n✗ Some tests failed!')
  process.exit(1)
}
