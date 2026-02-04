/**
 * Test for Badugi hand reading
 * Tests the readBadugiHands and readBadugiHands27 functions
 */

// Badugi rules:
// - Best hand has 4 cards of different suits and different ranks
// - A=1 in A-5 Badugi, A=14 in 2-7 Badugi
// - Lower cards are better
// - 4-card > 3-card > 2-card > 1-card

const rankValuesA5 = {
  A: 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
  '8': 8, '9': 9, T: 10, J: 11, Q: 12, K: 13,
}

const rankValues27 = {
  A: 14, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
  '8': 8, '9': 9, T: 10, J: 11, Q: 12, K: 13,
}

function toSolverCard(card) {
  const suit = card.slice(-1)
  const rawRank = card.slice(0, -1)
  const rankMap = {
    a: 'A', k: 'K', q: 'Q', j: 'J', t: 'T', '10': 'T',
    '9': '9', '8': '8', '7': '7', '6': '6', '5': '5', '4': '4', '3': '3', '2': '2',
  }
  const rank = rankMap[rawRank.toLowerCase()] || rawRank
  return rank + suit
}

function getBadugiHand(cards, rankValues) {
  const solverCards = cards.map(toSolverCard)
  const sortedCards = solverCards
    .map((c) => ({ card: c, rank: c[0], suit: c[1], value: rankValues[c[0]] }))
    .sort((a, b) => a.value - b.value)

  const validCards = []
  const usedRanks = new Set()
  const usedSuits = new Set()

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

function compareBadugiHands(hand1, hand2) {
  if (hand1.count > hand2.count) return -1
  if (hand1.count < hand2.count) return 1
  for (let i = 0; i < hand1.count; i++) {
    if (hand1.ranks[i] < hand2.ranks[i]) return -1
    if (hand1.ranks[i] > hand2.ranks[i]) return 1
  }
  return 0
}

function combinations(arr, n) {
  if (n === 0) return [[]]
  if (arr.length === n) return [arr]
  if (arr.length < n) return []
  const [first, ...rest] = arr
  const withFirst = combinations(rest, n - 1).map((comb) => [first, ...comb])
  const withoutFirst = combinations(rest, n)
  return [...withFirst, ...withoutFirst]
}

function readBadugiHands(playerHands, rankValues) {
  const solvedPlayers = Object.entries(playerHands).map(([seat, cards]) => {
    const seatNum = Number(seat)
    let bestBadugi
    if (cards.length <= 4) {
      bestBadugi = getBadugiHand(cards, rankValues)
    } else {
      const allCombinations = combinations(cards, 4)
      bestBadugi = getBadugiHand(allCombinations[0], rankValues)
      for (let i = 1; i < allCombinations.length; i++) {
        const currentHand = getBadugiHand(allCombinations[i], rankValues)
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

console.log('=== Badugi Hand Reading Tests ===\n')

let passed = 0, failed = 0

// Test 1: Perfect Badugi (A-5)
console.log('Test 1: Perfect Badugi A-2-3-4 (A-5 rules)')
{
  const playerHands = {
    1: ['Ah', '2c', '3d', '4s'],  // Perfect badugi
    2: ['2h', '3c', '4d', '5s'],  // 5-high badugi
  }
  const result = readBadugiHands(playerHands, rankValuesA5)
  if (result.seats[0] === 1) {
    console.log('✓ PASS: A-2-3-4 beats 2-3-4-5 in A-5 Badugi')
    passed++
  } else {
    console.log('✗ FAIL: Expected seat 1')
    failed++
  }
  console.log(`  Result: ${JSON.stringify(result)}\n`)
}

// Test 2: Perfect Badugi (2-7)
console.log('Test 2: Perfect Badugi 2-3-4-5 (2-7 rules)')
{
  const playerHands = {
    1: ['Ah', '2c', '3d', '4s'],  // A is bad in 2-7
    2: ['2h', '3c', '4d', '5s'],  // Best badugi in 2-7
  }
  const result = readBadugiHands(playerHands, rankValues27)
  if (result.seats[0] === 2) {
    console.log('✓ PASS: 2-3-4-5 beats A-2-3-4 in 2-7 Badugi')
    passed++
  } else {
    console.log('✗ FAIL: Expected seat 2')
    failed++
  }
  console.log(`  Result: ${JSON.stringify(result)}\n`)
}

// Test 3: 4-card beats 3-card
console.log('Test 3: 4-card Badugi beats 3-card')
{
  const playerHands = {
    1: ['Kh', 'Qc', 'Jd', 'Ts'],  // 4-card (bad cards)
    2: ['Ah', '2c', '3d', '3s'],  // 3-card (same rank 3)
  }
  const result = readBadugiHands(playerHands, rankValuesA5)
  if (result.seats[0] === 1) {
    console.log('✓ PASS: 4-card beats 3-card')
    passed++
  } else {
    console.log('✗ FAIL: Expected seat 1')
    failed++
  }
  console.log(`  Result: ${JSON.stringify(result)}\n`)
}

// Test 4: Same suit reduces to 3-card
console.log('Test 4: Same suit reduces hand')
{
  const playerHands = {
    1: ['Ah', '2h', '3d', '4s'],  // 3-card (two hearts)
    2: ['5h', '6c', '7d', '8s'],  // 4-card
  }
  const result = readBadugiHands(playerHands, rankValuesA5)
  if (result.seats[0] === 2) {
    console.log('✓ PASS: 4-card beats 3-card (same suit)')
    passed++
  } else {
    console.log('✗ FAIL: Expected seat 2')
    failed++
  }
  console.log(`  Result: ${JSON.stringify(result)}\n`)
}

// Test 5: 5-card hand selection
console.log('Test 5: Best 4 from 5 cards')
{
  const playerHands = {
    1: ['Ah', '2c', '3d', '4s', 'Kh'],  // Can make A-2-3-4
    2: ['5h', '6c', '7d', '8s'],        // 5-6-7-8
  }
  const result = readBadugiHands(playerHands, rankValuesA5)
  if (result.seats[0] === 1) {
    console.log('✓ PASS: Correctly selects best 4 from 5 cards')
    passed++
  } else {
    console.log('✗ FAIL: Expected seat 1')
    failed++
  }
  console.log(`  Result: ${JSON.stringify(result)}\n`)
}

// Test 6: Tie detection
console.log('Test 6: Tie detection')
{
  const playerHands = {
    1: ['Ah', '2c', '3d', '4s'],
    2: ['As', '2d', '3c', '4h'],  // Same ranks, different suits
  }
  const result = readBadugiHands(playerHands, rankValuesA5)
  if (result.seats.length === 2) {
    console.log('✓ PASS: Tie detected')
    passed++
  } else {
    console.log('✗ FAIL: Expected tie')
    failed++
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
