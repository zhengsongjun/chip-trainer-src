/**
 * Test for Drawmaha 49 and Drawmaha Zero hand reading
 */

// Rank values: J/Q/K = 0, A = 1, 2-10 = face value
const rankValues = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  T: 10, '10': 10, J: 0, Q: 0, K: 0, A: 1,
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

function read5Card49(playerHands) {
  const solvedPlayers = Object.entries(playerHands).map(([seat, cards]) => {
    const solverCards = cards.map(toSolverCard)
    let totalScore = 0
    for (const card of solverCards) {
      const rank = card[0]
      totalScore += rankValues[rank] || 0
    }
    const distanceTo49 = Math.abs(totalScore - 49)
    return { seat: Number(seat), totalScore, distanceTo49 }
  })

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

  return { seats: winnerSeats, scores: winnerScores, descr }
}

function read5CardZero(playerHands) {
  const solvedPlayers = Object.entries(playerHands).map(([seat, cards]) => {
    const solverCards = cards.map(toSolverCard)
    let totalScore = 0
    for (const card of solverCards) {
      const rank = card[0]
      totalScore += rankValues[rank] || 0
    }
    return { seat: Number(seat), totalScore }
  })

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

  return { seats: winnerSeats, scores: winnerScores, descr }
}

console.log('=== Drawmaha 49 Tests ===\n')

let passed = 0, failed = 0

// Test 1: Exact 49
console.log('Test 1: Exact 49 (10+10+10+10+9)')
{
  const playerHands = {
    1: ['Th', 'Tc', 'Td', 'Ts', '9h'],  // 10+10+10+10+9 = 49
    2: ['9h', '9c', '9d', '9s', '8h'],  // 9+9+9+9+8 = 44
  }
  const result = read5Card49(playerHands)
  if (result.seats[0] === 1 && result.scores[0] === 0) {
    console.log('✓ PASS')
    passed++
  } else {
    console.log('✗ FAIL')
    failed++
  }
  console.log(`  Result: ${result.descr}\n`)
}

// Test 2: J/Q/K count as 0
console.log('Test 2: J/Q/K count as 0')
{
  const playerHands = {
    1: ['Jh', 'Qc', 'Kd', 'Ks', 'Ah'],  // 0+0+0+0+1 = 1 (distance 48)
    2: ['Th', 'Tc', 'Td', 'Ts', 'Th'],  // 10+10+10+10+10 = 50 (distance 1)
  }
  const result = read5Card49(playerHands)
  if (result.seats[0] === 2) {
    console.log('✓ PASS: 50 is closer to 49 than 1')
    passed++
  } else {
    console.log('✗ FAIL')
    failed++
  }
  console.log(`  Result: ${result.descr}\n`)
}

// Test 3: Tie detection
console.log('Test 3: Tie detection (both distance 1)')
{
  const playerHands = {
    1: ['Th', 'Tc', 'Td', 'Ts', '8h'],  // 10+10+10+10+8 = 48 (distance 1)
    2: ['Th', 'Tc', 'Td', 'Ts', 'Th'],  // 10+10+10+10+10 = 50 (distance 1)
  }
  const result = read5Card49(playerHands)
  if (result.seats.length === 2) {
    console.log('✓ PASS: Tie detected')
    passed++
  } else {
    console.log('✗ FAIL')
    failed++
  }
  console.log(`  Result: ${result.descr}\n`)
}

console.log('=== Drawmaha Zero Tests ===\n')

// Test 4: All face cards = 0
console.log('Test 4: All face cards = 0')
{
  const playerHands = {
    1: ['Jh', 'Qc', 'Kd', 'Ks', 'Jh'],  // 0+0+0+0+0 = 0
    2: ['Ah', '2c', '3d', '4s', '5h'],  // 1+2+3+4+5 = 15
  }
  const result = read5CardZero(playerHands)
  if (result.seats[0] === 1 && result.scores[0] === 0) {
    console.log('✓ PASS')
    passed++
  } else {
    console.log('✗ FAIL')
    failed++
  }
  console.log(`  Result: ${result.descr}\n`)
}

// Test 5: A = 1
console.log('Test 5: A counts as 1')
{
  const playerHands = {
    1: ['Ah', 'Jc', 'Qd', 'Ks', 'Jh'],  // 1+0+0+0+0 = 1
    2: ['2h', 'Jc', 'Qd', 'Ks', 'Jh'],  // 2+0+0+0+0 = 2
  }
  const result = read5CardZero(playerHands)
  if (result.seats[0] === 1 && result.scores[0] === 1) {
    console.log('✓ PASS')
    passed++
  } else {
    console.log('✗ FAIL')
    failed++
  }
  console.log(`  Result: ${result.descr}\n`)
}

// Test 6: Tie detection for Zero
console.log('Test 6: Tie detection for Zero')
{
  const playerHands = {
    1: ['Jh', 'Qc', 'Kd', 'Ks', 'Jh'],  // 0
    2: ['Jh', 'Jc', 'Qd', 'Qs', 'Kh'],  // 0
  }
  const result = read5CardZero(playerHands)
  if (result.seats.length === 2) {
    console.log('✓ PASS: Tie detected')
    passed++
  } else {
    console.log('✗ FAIL')
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
