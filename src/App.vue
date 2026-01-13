<script setup>
import { ref } from 'vue'
import ChipStack from '@/components/ChipStack.vue'

/**
 * 筹码定义（商用可扩展）
 */
const CHIP_TYPES = {
  red: { value: 5 },
  green: { value: 25 },
  white: {value:1}
}

/**
 * 题库：总数值（始终是 5 的倍数）
 */
const TOTAL_VALUES = [
  50, 75, 100, 125, 150, 175, 200, 225, 250
]
function randomTotalValue() {
  const min = 10
  const max = 250
  const step = 5
  const n = Math.floor(Math.random() * ((max - min) / step + 1))
  return min + n * step
}

function splitRedStacks(count) {
  const result = []
  let remaining = count

  // 1️⃣ 20 优先
  while (remaining >= 20) {
    result.push(20)
    remaining -= 20
  }

  // 2️⃣ 20 以内，多拆 4 / 5
  while (remaining >= 4) {
    // 特殊情况：7
    if (remaining === 7) {
      if (Math.random() < 0.5) {
        result.push(4)
        result.push(3)
      } else {
        result.push(5)
        result.push(2)
      }
      remaining = 0
      break
    }

    // 正常情况：4 或 5 随机
    const choice = Math.random() < 0.5 ? 4 : 5

    if (remaining >= choice) {
      result.push(choice)
      remaining -= choice
    } else {
      // 如果选错了（比如剩 4 却选 5），换另一个
      const alt = choice === 4 ? 5 : 4
      if (remaining >= alt) {
        result.push(alt)
        remaining -= alt
      } else {
        break
      }
    }
  }

  // 3️⃣ 剩余 1 / 2 / 3 直接合并
  if (remaining > 0) {
    result.push(remaining)
  }

  return result
}



const round = ref(0)
const chipGroups = ref([])
const correctValue = ref(0)

const userInput = ref('')
const feedback = ref('idle')

function splitGreenStacks(count) {
  const result = []
  let remaining = count

  // 1️⃣ 20 个一组（递归思想，用 while）
  while (remaining >= 20) {
    result.push(20)
    remaining -= 20
  }

  // 2️⃣ 处理剩余 < 20
  if (remaining > 0) {
    // 特殊规则优先
    if (remaining === 6) {
      result.push(4, 2)
    } else if (remaining === 7) {
      result.push(4, 3)
    } else {
      // 通用规则：尽量 4 个一组
      while (remaining >= 4) {
        result.push(4)
        remaining -= 4
      }

      // 剩余 1 / 2 / 3
      if (remaining > 0) {
        result.push(remaining)
      }
    }
  }

  return result
}


function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * 生成一题（始终包含红 + 绿）
 */
 function generateChips() {
  const total = randomTotalValue() // 比如 300～2000

  // 1️⃣ 全部先当成红色
  let redCount = total / CHIP_TYPES.red.value

  // 2️⃣ 随机把一部分红色换成绿色
  // 例如：20%～40%
  const greenRatio = 0.2 + Math.random() * 0.2
  let greenCount = Math.floor((redCount * greenRatio) / 5) // 5 个红 = 1 个绿

  // 限制绿色数量，避免“满屏绿”
  greenCount = Math.min(greenCount, Math.floor(redCount / 5) - 1)
  if (greenCount < 1) greenCount = 1

  // 3️⃣ 扣掉被换掉的红色
  redCount -= greenCount * 5

  const groups = []

  // 4️⃣ 绿色排版（20 / 4 / 2 / 3 规则）
  const greenStacks = splitGreenStacks(greenCount)
  for (const c of greenStacks) {
    groups.push({ color: 'green', count: c })
  }

  // 5️⃣ 红色一大堆（现实中就是这样）
  const redStacks = splitRedStacks(redCount)
  for (const c of redStacks) {
    groups.push({ color: 'red', count: c })
  }

  return {
    groups,
    total
  }
}

function newRound() {
  round.value++
  userInput.value = ''
  feedback.value = 'idle'

  const { groups, total } = generateChips()
  chipGroups.value = groups
  correctValue.value = total
}

function onSubmit() {
  const val = parseInt(userInput.value, 10)
  if (Number.isNaN(val)) {
    feedback.value = 'wrong'
    return
  }

  if (val === correctValue.value) {
    feedback.value = 'correct'
    setTimeout(newRound, 700)
  } else {
    feedback.value = 'wrong'
  }
}

// 初始化
newRound()
</script>

<template>
  <main class="app">
    <header class="topbar">
      <h1>筹码反应训练</h1>
    </header>

    <section class="board">
      <div class="stacks">
        <div
          v-for="(group, idx) in chipGroups"
          :key="`${round}-${idx}`"
          class="stack"
        >
          <ChipStack
            :color="group.color"
            :count="group.count"
            :size="72"
            :spacing="10"
            :seed="`${round}-${idx}`"
          />
        </div>
      </div>
    </section>

    <section class="answer">
      <label class="input-wrap">
        请输入屏幕上筹码代表的总数值：
        <input
          v-model="userInput"
          type="number"
          inputmode="numeric"
          placeholder="例如 125"
          @keyup.enter="onSubmit"
          :class="feedback"
        />
      </label>

      <div class="actions">
        <button @click="onSubmit">提交</button>
        <button class="next" @click="newRound">换一题</button>
      </div>

      <p v-if="feedback === 'correct'" class="ok">
        正确！已为你生成下一题…
      </p>
      <p v-else-if="feedback === 'wrong'" class="err">
        不对哦，再看看筹码～
      </p>
    </section>
  </main>
</template>

<style scoped>
.app {
  max-width: 820px;
  margin: 0 auto;
  padding: 16px;
}

.topbar {
  display: flex;
  justify-content: space-between;
}

.board {
  margin: 16px 0 8px;
}

.stacks {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 14px;
  align-items: flex-end;
}

.stack {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.answer {
  margin-top: 10px;
  display: grid;
  gap: 10px;
}

.input-wrap {
  display: grid;
  gap: 6px;
}

input {
  padding: 10px 12px;
  font-size: 16px;
  border-radius: 8px;
  border: 1px solid #ccc;
  width: 220px;
}

input.correct {
  border-color: #16a34a;
}

input.wrong {
  border-color: #dc2626;
  animation: shake 0.18s linear 2;
}

.actions {
  display: flex;
  gap: 8px;
}

button {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #ccc;
  background: #fff;
}

button.next {
  background: #f7f7f7;
}

.ok {
  color: #16a34a;
}

.err {
  color: #dc2626;
}

@keyframes shake {
  0% { transform: translateX(0) }
  25% { transform: translateX(-2px) }
  50% { transform: translateX(2px) }
  75% { transform: translateX(-2px) }
  100% { transform: translateX(0) }
}
</style>
