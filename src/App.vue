<script setup>
import { ref } from 'vue'
import ChipStack from '@/components/ChipStack.vue'

/**
 * 筹码定义
 */
const CHIP_TYPES = {
  red: { value: 5 },
  green: { value: 25 },
  white: { value: 1 },
}

/**
 * 随机总值（5 的倍数）
 */
function randomTotalValue() {
  const min = 10
  const max = 250
  const step = 5
  const n = Math.floor(Math.random() * ((max - min) / step + 1))
  return min + n * step
}

/**
 * 红色分组
 */
function splitRedStacks(count) {
  const result = []
  let remaining = count

  while (remaining >= 20) {
    result.push(20)
    remaining -= 20
  }

  while (remaining >= 4) {
    if (remaining === 7) {
      Math.random() < 0.5
        ? result.push(4, 3)
        : result.push(5, 2)
      remaining = 0
      break
    }

    const choice = Math.random() < 0.5 ? 4 : 5
    if (remaining >= choice) {
      result.push(choice)
      remaining -= choice
    } else {
      const alt = choice === 4 ? 5 : 4
      if (remaining >= alt) {
        result.push(alt)
        remaining -= alt
      } else break
    }
  }

  if (remaining > 0) result.push(remaining)
  return result
}

/**
 * 绿色分组
 */
function splitGreenStacks(count) {
  const result = []
  let remaining = count

  while (remaining >= 20) {
    result.push(20)
    remaining -= 20
  }

  if (remaining > 0) {
    if (remaining === 6) result.push(4, 2)
    else if (remaining === 7) result.push(4, 3)
    else {
      while (remaining >= 4) {
        result.push(4)
        remaining -= 4
      }
      if (remaining > 0) result.push(remaining)
    }
  }

  return result
}

/**
 * 白色分组（20 / 5 / remainder）
 */
function splitWhiteStacks(count) {
  const result = []
  let remaining = count

  while (remaining >= 20) {
    result.push(20)
    remaining -= 20
  }

  while (remaining >= 5) {
    result.push(5)
    remaining -= 5
  }

  if (remaining > 0) result.push(remaining)
  return result
}

/* ================= 状态 ================= */

const round = ref(0)
const chipGroups = ref([])
const correctValue = ref(0)

const userInput = ref('')
const feedback = ref('idle')

// Element Plus 颜色选择（默认全选）
const enabledColors = ref(['green', 'red', 'white'])

// 白色数量区间
const whiteRange = ref('1-20')

function getEnabledColors() {
  return enabledColors.value
}

/* ================= 出题逻辑 ================= */

function generateChips() {
  const colors = enabledColors.value
  const groups = []

  let total = 0

  // ===== 白色（必出现）=====
  let whiteCount = 0
  if (colors.includes('white')) {
    whiteCount =
      whiteRange.value === '1-20'
        ? Math.floor(Math.random() * 20) + 1
        : Math.floor(Math.random() * 41) + 20

    splitWhiteStacks(whiteCount).forEach(c => {
      groups.push({ color: 'white', count: c })
    })

    total += whiteCount * CHIP_TYPES.white.value
  }

  // ===== 红 / 绿（至少 1 组）=====
  let redCount = 0
  let greenCount = 0

  if (colors.includes('red') || colors.includes('green')) {
    // 至少 5 个红起步
    redCount = Math.floor(Math.random() * 20 + 5)

    if (colors.includes('green')) {
      // 至少 1 个绿
      greenCount = Math.max(1, Math.floor(redCount / 5))
      redCount -= greenCount * 5
    }

    if (colors.includes('green') && greenCount > 0) {
      splitGreenStacks(greenCount).forEach(c => {
        groups.push({ color: 'green', count: c })
      })
      total += greenCount * CHIP_TYPES.green.value
    }

    if (colors.includes('red') && redCount > 0) {
      splitRedStacks(redCount).forEach(c => {
        groups.push({ color: 'red', count: c })
      })
      total += redCount * CHIP_TYPES.red.value
    }
  }

  const order = {
    green: 0,
    red: 1,
    white: 2,
  }

  groups.sort((a, b) => order[a.color] - order[b.color])

  return {
    groups,
    total,
  }
}


/* ================= 交互 ================= */

function newRound() {
  round.value++
  userInput.value = ''
  feedback.value = 'idle'
  const { groups, total } = generateChips()
  chipGroups.value = groups
  correctValue.value = total
}

function onSubmit() {
  const val = Number(userInput.value)
  feedback.value = val === correctValue.value ? 'correct' : 'wrong'
  if (feedback.value === 'correct') setTimeout(newRound, 700)
}

newRound()
</script>

<template>
  <main class="app">
    <header class="topbar">
      <h1>筹码反应训练</h1>
    </header>

    <!-- 配置区 -->
    <el-form label-position="top" class="filters">
      <el-form-item label="筹码颜色">
        <el-checkbox-group v-model="enabledColors">
          <el-space size="large">
            <el-checkbox label="green">绿色</el-checkbox>
            <el-checkbox label="red">红色</el-checkbox>
            <el-checkbox label="white">白色</el-checkbox>
          </el-space>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item v-if="enabledColors.includes('white')" label="白色筹码数量">
        <el-radio-group v-model="whiteRange">
          <el-space size="large">
            <el-radio label="1-20">1–20 个白色</el-radio>
            <el-radio label="20-60">20–60 个白色</el-radio>
          </el-space>
        </el-radio-group>
      </el-form-item>
    </el-form>

    <!-- 筹码展示 -->
    <section class="board">
      <div class="stacks">
        <div v-for="(group, idx) in chipGroups" :key="`${round}-${idx}`" class="stack">
          <ChipStack
            :color="group.color"
            :count="group.count"
            :size="72"
            :spacing="10"
          />
        </div>
      </div>
    </section>

    <!-- 答题 -->
    <section class="answer">
      <input
        v-model="userInput"
        type="number"
        placeholder="请输入总数值"
        @keyup.enter="onSubmit"
        :class="feedback"
      />

      <div class="actions">
        <button @click="onSubmit">提交</button>
        <button @click="newRound">换一题</button>
      </div>

      <p v-if="feedback === 'correct'" class="ok">正确！</p>
      <p v-else-if="feedback === 'wrong'" class="err">不对哦～</p>
    </section>
  </main>
</template>

<style scoped>
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
}

.board {
  margin: 16px 0;
}

.stacks {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
}

.stack {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.answer {
  margin-top: 16px;
  display: grid;
  gap: 10px;
}

input {
  padding: 10px;
  font-size: 16px;
}

input.correct {
  border: 1px solid #16a34a;
}

input.wrong {
  border: 1px solid #dc2626;
}

.actions {
  display: flex;
  gap: 8px;
}

.ok {
  color: #16a34a;
}

.err {
  color: #dc2626;
}

.filters {
  margin-bottom: 12px;
}
</style>
