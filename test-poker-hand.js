import { read5CardA5LowHands } from "./src/utils/PokerHandReader.js";

// 测试场景：
// 手牌 1: 8sqs3s8h8c（三条）
// 手牌 2: tc5cjdqd5d（两对）
// 预期结果：tc5cjdqd5d 更 Low（获胜）

const playerHands = {
  1: ["8s", "qs", "3s", "8h", "8c"],
  2: ["tc", "5c", "jd", "qd", "5d"]
};

try {
  const result = read5CardA5LowHands(playerHands);
  console.log("测试结果:");
  console.log(`获胜座位: ${result.seats}`);
  console.log(`获胜手牌: ${result.hands[0]?.descr}`);
  
  if (result.seats.includes(2)) {
    console.log("✅ 测试通过：tc5cjdqd5d 获胜");
  } else {
    console.log("❌ 测试失败：预期座位 2 获胜");
  }
} catch (error) {
  console.error("❌ 测试过程中出错:", error);
}
