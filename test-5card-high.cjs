/**
 * Test for 5 Card Draw high hand reading
 * Tests the read5CardHigh function
 */

const pokersolver = require('pokersolver')
const Hand = pokersolver.Hand

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

function read5CardHigh(playerHands) {
  const solvedPlayers = Object.entries(playerHands).map(([seat, cards]) => {
    const hand = Hand.solve(cards.map(toSolverCard))
    return { seat: Number(seat), hand }
  })

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

console.log('=== 5 Card Draw High Hand Reading Tests ===\n')

let passed = 0, failed = 0

// Test 1: Royal Flush beats Straight Flush
console.log('Test 1: Royal Flush beats Straight Flush')
{
  const playerHands = {
    1: ['Ah', 'Kh', 'Qh', 'Jh', 'Th'],  // Royal Flush
    2: ['9h', '8h', '7h', '6h', '5h'],   // Straight Flush
  }
  const result = read5CardHigh(playerHands)
  if (result.seats[0] === 1) {
    console.log('✓ PASS')
    passed++
  } else {
    console.log('✗ FAIL: Expected seat 1')
    failed++
  }
  console.log(`  Result: ${result.descr}\n`)
}

// Test 2: Four of a Kind beats Full House
console.log('Test 2: Four of a Kind beats Full House')
{
  const playerHands = {
    1: ['Ah', 'As', 'Ad', 'Ac', '2h'],   // Four Aces
    2: ['Kh', 'Ks', 'Kd', 'Qh', 'Qs'],   // Full House K over Q
  }
  const result = read5CardHigh(playerHands)
  if (result.seats[0] === 1) {
    console.log('✓ PASS')
    passed++
  } else {
    console.log('✗ FAIL: Expected seat 1')
    failed++
  }
  console.log(`  Result: ${result.descr}\n`)
}

// Test 3: Flush beats Straight
console.log('Test 3: Flush beats Straight')
{
  const playerHands = {
    1: ['Ah', '9h', '7h', '5h', '3h'],   // Flush
    2: ['9c', '8d', '7h', '6s', '5c'],   // Straight
  }
  const result = read5CardHigh(playerHands)
  if (result.seats[0] === 1) {
    console.log('✓ PASS')
    passed++
  } else {
    console.log('✗ FAIL: Expected seat 1')
    failed++
  }
  console.log(`  Result: ${result.descr}\n`)
}

// Test 4: Two Pair beats One Pair
console.log('Test 4: Two Pair beats One Pair')
{
  const playerHands = {
    1: ['Ah', 'As', 'Kh', 'Ks', '2c'],   // Two Pair AA KK
    2: ['Qh', 'Qs', 'Jd', '9c', '7h'],   // One Pair QQ
  }
  const result = read5CardHigh(playerHands)
  if (result.seats[0] === 1) {
    console.log('✓ PASS')
    passed++
  } else {
    console.log('✗ FAIL: Expected seat 1')
    failed++
  }
  console.log(`  Result: ${result.descr}\n`)
}

// Test 5: Tie detection (same hand)
console.log('Test 5: Tie detection')
{
  const playerHands = {
    1: ['Ah', 'Kc', 'Qd', 'Js', '9h'],   // A-high
    2: ['As', 'Kd', 'Qh', 'Jc', '9s'],   // A-high (same)
  }
  const result = read5CardHigh(playerHands)
  if (result.seats.length === 2) {
    console.log('✓ PASS')
    passed++
  } else {
    console.log('✗ FAIL: Expected tie')
    failed++
  }
  console.log(`  Result: ${result.descr}\n`)
}

// Test 6: Multiple players
console.log('Test 6: Multiple players (3 players)')
{
  const playerHands = {
    1: ['Ah', 'As', 'Ad', '2c', '3h'],   // Three Aces
    2: ['Kh', 'Ks', 'Kd', '4c', '5h'],   // Three Kings
    3: ['Qh', 'Qs', 'Qd', '6c', '7h'],   // Three Queens
  }
  const result = read5CardHigh(playerHands)
  if (result.seats[0] === 1) {
    console.log('✓ PASS')
    passed++
  } else {
    console.log('✗ FAIL: Expected seat 1')
    failed++
  }
  console.log(`  Result: ${result.descr}\n`)
}

console.log('=== Summary ===')
console.log(`Passed: ${passed}/${passed + failed}`)

if (failed === 0) {
  console.log('\n✓ All tests passed!')
} else {
  console.log(`\n✗ ${failed} test(s) failed!`)
  process.exit(1)
}
