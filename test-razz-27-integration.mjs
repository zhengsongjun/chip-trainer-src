/**
 * Integration test for Razz 2-7 Low hand reading
 * Tests the read7CardHandLow27 function from PokerHandReader.ts
 *
 * This test simulates the actual usage in BoardAnalysis
 */

import { read7CardHandLow27, read7CardHandLowA5Regular } from './src/utils/PokerHandReader.ts'

console.log('=== Razz 2-7 Integration Tests ===\n')

let passed = 0
let failed = 0

// Helper to create Card objects
function createCard(cardStr) {
  const rankMap = { 'T': '10', 'J': 'J', 'Q': 'Q', 'K': 'K', 'A': 'A' }
  const suitMap = { 'h': 'hearts', 'd': 'diamonds', 'c': 'clubs', 's': 'spades' }

  const rank = cardStr[0]
  const suit = cardStr[1]

  return {
    rank: rankMap[rank] || rank,
    suit: suitMap[suit],
    toString() { return cardStr }
  }
}

// Test 1: Basic 7-card hand selection (should pick best 5 from 7)
console.log('Test 1: Basic 7-card hand selection')
{
  // Player 1: Has 7-5-4-3-2 available (best 2-7 low)
  // Player 2: Has 8-5-4-3-2 available
  const playerHands = {
    1: [createCard('7h'), createCard('5c'), createCard('4d')],  // 3 hole cards
    2: [createCard('8h'), createCard('5s'), createCard('4c')]
  }
  const playerStudCards = {
    1: [createCard('3s'), createCard('2h'), createCard('Kc'), createCard('Qd')],  // 4 stud cards
    2: [createCard('3d'), createCard('2c'), createCard('Kh'), createCard('Qs')]
  }

  const result = read7CardHandLow27(playerHands, playerStudCards)

  if (result.seats.length === 1 && result.seats[0] === 1) {
    console.log('✓ PASS: Player 1 wins with 7-high')
    console.log(`  Winner: Seat ${result.seats[0]}`)
    console.log(`  Description: ${result.descr}`)
    passed++
  } else {
    console.log('✗ FAIL: Expected Player 1 to win')
    console.log(`  Got: ${JSON.stringify(result)}`)
    failed++
  }
}
console.log()

// Test 2: Tie detection
console.log('Test 2: Tie detection')
{
  // Both players have identical best hands: 7-5-4-3-2
  const playerHands = {
    1: [createCard('7h'), createCard('5c'), createCard('4d')],
    2: [createCard('7s'), createCard('5d'), createCard('4h')]
  }
  const playerStudCards = {
    1: [createCard('3s'), createCard('2h'), createCard('Kc'), createCard('Qd')],
    2: [createCard('3c'), createCard('2d'), createCard('Kh'), createCard('Qs')]
  }

  const result = read7CardHandLow27(playerHands, playerStudCards)

  if (result.seats.length === 2 && result.seats.includes(1) && result.seats.includes(2)) {
    console.log('✓ PASS: Tie detected correctly')
    console.log(`  Winners: Seats ${result.seats.join(', ')}`)
    passed++
  } else {
    console.log('✗ FAIL: Expected tie between Player 1 and 2')
    console.log(`  Got: ${JSON.stringify(result)}`)
    failed++
  }
}
console.log()

// Test 3: Pair vs High Card (High Card should win in 2-7)
console.log('Test 3: Pair vs High Card')
{
  // Player 1: Best hand is a pair (bad)
  // Player 2: Best hand is high card (good)
  const playerHands = {
    1: [createCard('7h'), createCard('7c'), createCard('4d')],  // Has pair of 7s
    2: [createCard('Ah'), createCard('Kc'), createCard('Qd')]   // High cards only
  }
  const playerStudCards = {
    1: [createCard('3s'), createCard('2h'), createCard('5c'), createCard('6d')],
    2: [createCard('Jh'), createCard('9s'), createCard('8c'), createCard('2d')]
  }

  const result = read7CardHandLow27(playerHands, playerStudCards)

  // Player 2 should win because high card beats pair in 2-7 low
  if (result.seats.length === 1 && result.seats[0] === 2) {
    console.log('✓ PASS: High Card beats Pair')
    console.log(`  Winner: Seat ${result.seats[0]}`)
    console.log(`  Description: ${result.descr}`)
    passed++
  } else {
    console.log('✗ FAIL: Expected Player 2 (High Card) to beat Player 1 (Pair)')
    console.log(`  Got: ${JSON.stringify(result)}`)
    failed++
  }
}
console.log()

// Test 4: Flush is bad in 2-7
console.log('Test 4: Flush is bad in 2-7')
{
  // Player 1: Has flush (bad in 2-7)
  // Player 2: Has high card with worse cards but no flush
  const playerHands = {
    1: [createCard('7h'), createCard('5h'), createCard('4h')],  // All hearts
    2: [createCard('Kc'), createCard('Qd'), createCard('Js')]   // Mixed suits
  }
  const playerStudCards = {
    1: [createCard('3h'), createCard('2h'), createCard('Ac'), createCard('Ad')],  // More hearts = flush
    2: [createCard('9h'), createCard('8c'), createCard('7d'), createCard('6s')]   // No flush
  }

  const result = read7CardHandLow27(playerHands, playerStudCards)

  // Player 2 should win because flush is worse than high card in 2-7
  if (result.seats.length === 1 && result.seats[0] === 2) {
    console.log('✓ PASS: High Card beats Flush')
    console.log(`  Winner: Seat ${result.seats[0]}`)
    console.log(`  Description: ${result.descr}`)
    passed++
  } else {
    console.log('✗ FAIL: Expected Player 2 (High Card) to beat Player 1 (Flush)')
    console.log(`  Got: ${JSON.stringify(result)}`)
    failed++
  }
}
console.log()

// Test 5: Straight is bad in 2-7
console.log('Test 5: Straight is bad in 2-7')
{
  // Player 1: Has straight 6-5-4-3-2 (bad in 2-7)
  // Player 2: Has 7-5-4-3-2 no straight (good)
  const playerHands = {
    1: [createCard('6h'), createCard('5c'), createCard('4d')],
    2: [createCard('7h'), createCard('5d'), createCard('4c')]
  }
  const playerStudCards = {
    1: [createCard('3s'), createCard('2h'), createCard('Kc'), createCard('Qd')],  // Makes straight
    2: [createCard('3s'), createCard('2c'), createCard('Kh'), createCard('Qs')]   // No straight
  }

  const result = read7CardHandLow27(playerHands, playerStudCards)

  // Player 2 should win because straight is worse than high card in 2-7
  if (result.seats.length === 1 && result.seats[0] === 2) {
    console.log('✓ PASS: High Card (7-high) beats Straight')
    console.log(`  Winner: Seat ${result.seats[0]}`)
    console.log(`  Description: ${result.descr}`)
    passed++
  } else {
    console.log('✗ FAIL: Expected Player 2 (7-high) to beat Player 1 (Straight)')
    console.log(`  Got: ${JSON.stringify(result)}`)
    failed++
  }
}
console.log()

// Test 6: Compare with A-5 Low (different rules)
console.log('Test 6: Compare 2-7 vs A-5 rules')
{
  // In A-5: A-2-3-4-5 (wheel) is the best hand
  // In 2-7: A-2-3-4-5 is a straight (bad), 7-5-4-3-2 is best
  const playerHands = {
    1: [createCard('Ah'), createCard('2c'), createCard('3d')],  // Can make wheel
    2: [createCard('7h'), createCard('5c'), createCard('4d')]   // Can make 7-5-4-3-2
  }
  const playerStudCards = {
    1: [createCard('4s'), createCard('5h'), createCard('Kc'), createCard('Qd')],
    2: [createCard('3s'), createCard('2h'), createCard('Kh'), createCard('Qs')]
  }

  const result27 = read7CardHandLow27(playerHands, playerStudCards)
  const resultA5 = read7CardHandLowA5Regular(playerHands, playerStudCards)

  console.log('  2-7 Low result:')
  console.log(`    Winner: Seat ${result27.seats.join(', ')}`)
  console.log(`    Description: ${result27.descr}`)

  console.log('  A-5 Low result:')
  console.log(`    Winner: Seat ${resultA5.seats.join(', ')}`)
  console.log(`    Description: ${resultA5.descr}`)

  // In 2-7, Player 2 should win (7-high beats wheel/straight)
  // In A-5, Player 1 should win (wheel is best)
  if (result27.seats[0] === 2 && resultA5.seats[0] === 1) {
    console.log('✓ PASS: Different winners for 2-7 vs A-5 rules')
    passed++
  } else {
    console.log('✗ FAIL: Expected different winners')
    console.log(`  2-7 winner: ${result27.seats[0]}, A-5 winner: ${resultA5.seats[0]}`)
    failed++
  }
}
console.log()

// Summary
console.log('=== Summary ===')
console.log(`Passed: ${passed}`)
console.log(`Failed: ${failed}`)
console.log(`Total: ${passed + failed}`)

if (failed === 0) {
  console.log('\n✓ All integration tests passed!')
} else {
  console.log('\n✗ Some tests failed!')
  process.exit(1)
}
