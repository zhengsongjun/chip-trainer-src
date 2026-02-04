import { read5CardA5LowHands } from './src/utils/PokerHandReader'

// 测试用户提到的例子
const testHands = {
  1: ['7d', '7c', '6h', '9d', '5d'], // 一对7
  2: ['9s', 'Js', 'Jh', '2d', '3s']  // 一对J
}

const result = read5CardA5LowHands(testHands)

console.log('测试结果：')
console.log(`赢家座位号：${result.seats}`)
console.log(`获胜手牌：${result.descr}`)

// 验证结果是否正确
if (result.seats.includes(1)) {
  console.log('✅ 测试通过！一对7（座位1）获胜')
} else {
  console.log('❌ 测试失败！一对J（座位2）获胜，应该是一对7获胜')
}

// 打印更详细的信息
console.log('\n详细信息：')
result.hands.forEach((hand, index) => {
  console.log(`座位${result.seats[index]}: ${hand.descr}`)
  console.log(`分数: ${hand.score}, 高牌: ${hand.highCards}`)
})