const { read5CardA5LowHands } = require('./src/utils/PokerHandReader')

// 测试用户提到的例子
const testHands = {
  1: ['7d', '7c', '6h', '9d', '5d'], // 一对7
  2: ['9s', 'Js', 'Jh', '2d', '3s']  // 一对J
}

const result = read5CardA5LowHands(testHands)

console.log('Test Result:')
console.log(`Winner seats: ${result.seats}`)
console.log(`Winning hand: ${result.descr}`)

// Verify if result is correct
if (result.seats.includes(1)) {
  console.log('✅ Test passed! Pair of 7 (seat 1) wins')
} else {
  console.log('❌ Test failed! Pair of J (seat 2) wins, but should be pair of 7')
}

// Print detailed info
console.log('\nDetailed Info:')
result.hands.forEach((hand, index) => {
  console.log(`Seat ${result.seats[index]}: ${hand.descr}`)
  console.log(`Score: ${hand.score}, High Cards: ${hand.highCards}`)
})