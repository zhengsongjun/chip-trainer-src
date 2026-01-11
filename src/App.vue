<!-- src/App.vue -->
<script setup>
import { ref, computed } from 'vue'
import ChipStack from '@/components/ChipStack.vue'

// 题库：10..100（步长 5）
const targets = Array.from({ length: 150 }, (_, i) => i + 1)

const round = ref(0)
const target = ref(10)
const userInput = ref('')
const feedback = ref('idle') // 'idle' | 'correct' | 'wrong'
const color = ref('red')

// 余数部分的分组（4 或 5），在每轮初始化时决定
const remainderGroupSize = ref(null) // 4 | 5 | null

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function newRound() {
  round.value++
  target.value = pickRandom(targets)
  userInput.value = ''
  feedback.value = 'idle'

  const r = target.value % 20
  remainderGroupSize.value = r > 0 ? pickRandom([4, 5]) : null
}

// 计算要展示的各个堆叠的“层数数组”，例如 [20, 20, 5, 5, 3]
const stacks = computed(() => {
  const total = target.value
  const result = []

  if (total >= 20) {
    const full20 = Math.floor(total / 20)
    for (let i = 0; i < full20; i++) result.push(20)
  }

  const rem = target.value % 20
  if (rem > 0) {
    const g = remainderGroupSize.value ?? 5
    const full = Math.floor(rem / g)
    for (let i = 0; i < full; i++) result.push(g)

    const last = rem % g
    if (last > 0) result.push(last)
  }

  // total < 20 的情况：直接用 4 或 5 一叠（最后显示余数）
  if (total < 20) {
    const g = pickRandom([4, 5])
    const full = Math.floor(total / g)
    for (let i = 0; i < full; i++) result.push(g)
    const last = total % g
    if (last > 0) result.push(last)
  }

  return result
})

function onSubmit() {
  const val = parseInt(userInput.value, 10)
  if (Number.isNaN(val)) {
    feedback.value = 'wrong'
    return
  }
  if (val === target.value * 5) {
    feedback.value = 'correct'
    setTimeout(newRound, 700)
  } else {
    feedback.value = 'wrong'
  }
}

// 初始化第一题
newRound()
</script>

<template>
  <main class="app">
    <header class="topbar">
      <h1>筹码反应训练</h1>
      <div class="meta">
      </div>
    </header>

    <section class="board">
      <div class="stacks">
        <div
          v-for="(cnt, idx) in stacks"
          :key="`${round}-${idx}-${cnt}`"
          class="stack"
        >
          <ChipStack
            :color="color"
            :count="cnt"
            :size="72"
            :spacing="10"
            :seed="`${round}-${idx}`"
          />
        </div>
      </div>
    </section>

    <section class="answer">
      <label class="input-wrap">
        请输入屏幕上筹码的总数：
        <input
          v-model="userInput"
          type="number"
          inputmode="numeric"
          pattern="[0-9]*"
          placeholder="例如 35"
          @keyup.enter="onSubmit"
          :class="feedback"
        />
      </label>

      <div class="actions">
        <button @click="onSubmit">提交</button>
        <button class="next" @click="newRound">换一题</button>
      </div>

      <p v-if="feedback==='correct'" class="ok">正确！已为你生成下一题…</p>
      <p v-else-if="feedback==='wrong'" class="err">不对哦，再看看筹码总数～</p>
    </section>
  </main>
</template>

<style scoped>
.app { max-width: 820px; margin: 0 auto; padding: 16px; }
.topbar { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.meta { font-size: 12px; color: #666; display: flex; gap: 12px; }

.board { margin: 16px 0 8px; }
.stacks {
  display: flex;
  flex-wrap: wrap;
  gap: 5px 9px;
  align-items: flex-end;
}
.stack {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.stack .label { margin-top: 6px; font-size: 12px; color: #888; }

.answer { margin-top: 8px; display: grid; gap: 10px; }
.input-wrap { display: grid; gap: 6px; }
input {
  padding: 10px 12px;
  font-size: 16px;
  border-radius: 8px;
  border: 1px solid #ccc;
  width: 180px;
}
input.correct { border-color: #16a34a; }
input.wrong   { border-color: #dc2626; animation: shake 0.18s linear 2; }

.actions { display: flex; gap: 8px; }
button {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #ccc;
  background: #fff;
}
button.next { background: #f7f7f7; }

.ok  { color: #16a34a; }
.err { color: #dc2626; }

@keyframes shake {
  0% { transform: translateX(0) }
  25% { transform: translateX(-2px) }
  50% { transform: translateX(2px) }
  75% { transform: translateX(-2px) }
  100% { transform: translateX(0) }
}
</style>
