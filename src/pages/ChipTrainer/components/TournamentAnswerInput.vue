<script setup lang="ts">
  import { ref, nextTick, watch } from 'vue'

  const props = defineProps<{
    modelValue: string
    length?: number
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', val: string): void
  }>()

  const len = props.length ?? 7

  /* ================= 数据源 ================= */
  const values = ref<string[]>(Array(len).fill(''))

  /* ================= input refs（index 对齐） ================= */
  const inputs = ref<(HTMLInputElement | null)[]>([])
  function setInputRef(el: HTMLInputElement | null, index: number) {
    inputs.value[index] = el
  }

  /* ================= 内部同步锁 ================= */
  let syncingFromInside = false

  function syncValue() {
    syncingFromInside = true
    emit('update:modelValue', values.value.join(''))
    nextTick(() => {
      syncingFromInside = false
    })
  }

  /* ================= 外部 modelValue → 内部 ================= */
  watch(
    () => props.modelValue,
    (val) => {
      if (syncingFromInside) return

      // ⭐️ 外部清空：彻底 reset + 聚焦第一个
      if (!val) {
        values.value = Array(len).fill('')
        nextTick(() => {
          inputs.value[0]?.focus()
        })
        return
      }

      const chars = val.replace(/\D/g, '').slice(0, len).split('')
      values.value = Array.from({ length: len }, (_, i) => chars[i] ?? '')
    },
    { immediate: true }
  )

  /* ================= 输入（插入式，整体右移） ================= */
  function onInput(e: Event, index: number) {
    const input = e.target as HTMLInputElement
    const digit = input.value.replace(/\D/g, '').slice(-1)

    input.value = ''
    if (!digit) return

    for (let i = len - 1; i > index; i--) {
      values.value[i] = values.value[i - 1]
    }

    values.value[index] = digit
    syncValue()

    nextTick(() => {
      inputs.value[Math.min(index + 1, len - 1)]?.focus()
    })
  }

  /* ================= 删除（整体左移） ================= */
  function onKeydown(e: KeyboardEvent, index: number) {
    if (e.key !== 'Backspace') return
    e.preventDefault()

    for (let i = index; i < len - 1; i++) {
      values.value[i] = values.value[i + 1]
    }
    values.value[len - 1] = ''

    syncValue()

    nextTick(() => {
      inputs.value[Math.max(index - 1, 0)]?.focus()
    })
  }

  /* ================= 重置 ================= */
  function reset() {
    values.value = Array(len).fill('')
    emit('update:modelValue', '')
  }

  defineExpose({ reset })
</script>

<template>
  <div class="tournament-input">
    <!-- 前 3 位 -->
    <div class="digits">
      <input
        v-for="i in 3"
        :key="i - 1"
        :ref="(el) => setInputRef(el, i - 1)"
        class="digit"
        inputmode="numeric"
        :value="values[i - 1]"
        @input="onInput($event, i - 1)"
        @keydown="onKeydown($event, i - 1)"
      />
    </div>

    <span class="comma">,</span>

    <!-- 中间 3 位 -->
    <div class="digits">
      <input
        v-for="i in 3"
        :key="i + 2"
        :ref="(el) => setInputRef(el, i + 2)"
        class="digit"
        inputmode="numeric"
        :value="values[i + 2]"
        @input="onInput($event, i + 2)"
        @keydown="onKeydown($event, i + 2)"
      />
    </div>

    <span class="comma">,</span>

    <!-- 最后一位 -->
    <input
      :ref="(el) => setInputRef(el, 6)"
      class="digit"
      inputmode="numeric"
      :value="values[6]"
      @input="onInput($event, 6)"
      @keydown="onKeydown($event, 6)"
    />

    <span class="suffix">00</span>
  </div>
</template>

<style scoped>
  .tournament-input {
    display: flex;
    align-items: flex-end;
    gap: 8px;
  }

  .digit {
    width: 52px;
    height: 68px;
    margin-right: 6px;
    /* Element Plus input 风格 */
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
    background-color: var(--el-fill-color-blank);

    text-align: center;
    font-size: 34px;
    font-weight: 700;
    line-height: 68px;

    outline: none;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;
  }

  /* hover 状态 */
  .digit:hover {
    border-color: var(--el-border-color-hover);
  }

  /* focus 状态（与 el-input 一致） */
  .digit:focus {
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 1px var(--el-color-primary-light-7);
  }

  .comma {
    font-size: 32px;
    font-weight: 700;
    padding-bottom: 8px;
  }

  .suffix {
    font-size: 28px;
    font-weight: 700;
    padding-bottom: 8px;
  }
</style>
