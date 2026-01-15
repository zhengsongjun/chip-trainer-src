<script setup lang="ts">
import { ref, nextTick } from 'vue'

const props = defineProps<{
  modelValue: string
  length?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
}>()

const len = props.length ?? 7

// 内部状态：每个格子的值（这是唯一权威）
const values = ref<string[]>(Array(len).fill(''))

// refs 用来控制 focus
const inputs = ref<HTMLInputElement[]>([])

// 对外同步（只拼接，不反推）
function syncValue() {
  emit('update:modelValue', values.value.join(''))
}

// 输入处理（所见即所得）
function onInput(e: Event, index: number) {
  const input = e.target as HTMLInputElement
  const v = input.value.replace(/\D/g, '')

  values.value[index] = v.slice(-1) || ''
  syncValue()

  // 自动跳到下一个（只影响 focus，不影响值）
  if (v && index < len - 1) {
    nextTick(() => inputs.value[index + 1]?.focus())
  }
}

// 退格逻辑
function onKeydown(e: KeyboardEvent, index: number) {
  if (e.key === 'Backspace') {
    if (values.value[index]) {
      values.value[index] = ''
      syncValue()
    } else if (index > 0) {
      nextTick(() => inputs.value[index - 1]?.focus())
    }
  }
}

// 点击聚焦
function focusIndex(index: number) {
  nextTick(() => inputs.value[index]?.focus())
}

// 👉 对外暴露一个 reset 方法（供 newRound 使用）
function reset() {
  values.value = Array(len).fill('')
  emit('update:modelValue', '')
}

defineExpose({ reset })
</script>

<template>
  <div class="tournament-input">
    <div class="digits">
      <input
        v-for="(_, i) in values"
        :key="i"
        ref="inputs"
        class="digit"
        inputmode="numeric"
        maxlength="1"
        :value="values[i]"
        @input="onInput($event, i)"
        @keydown="onKeydown($event, i)"
        @click="focusIndex(i)"
      />
    </div>
    <span class="suffix">,00</span>
  </div>
</template>

<style scoped>
.tournament-input {
  display: flex;
  align-items: flex-end;
  gap: 10px;
}

.digits {
  display: flex;
  gap: 8px;
}

.digit {
  width: 52px;
  height: 68px;
  border: 2px solid #111;
  border-radius: 6px;
  background: #fff;
  text-align: center;
  font-size: 34px;
  font-weight: 700;
  line-height: 68px;
  outline: none;
}

.digit:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.25);
}

.suffix {
  font-size: 28px;
  font-weight: 700;
  padding-bottom: 8px;
}
</style>
