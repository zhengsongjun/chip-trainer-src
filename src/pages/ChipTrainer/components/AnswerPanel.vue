<script setup lang="ts">
  defineProps<{
    modelValue: string
    feedback: 'idle' | 'correct' | 'wrong'
    correctValue: number
    showAnswer: boolean
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', val: string): void
    (e: 'submit'): void
    (e: 'next'): void
    (e: 'toggleAnswer'): void
  }>()
</script>

<template>
  <section class="answer">
    <input
      :value="modelValue"
      type="number"
      placeholder="请输入总数值"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @keyup.enter="emit('submit')"
      :class="feedback"
    />

    <div class="actions">
      <button @click="emit('submit')">提交</button>
      <button @click="emit('next')">换一题</button>
      <button @click="emit('toggleAnswer')">显示答案</button>
    </div>

    <p v-if="feedback === 'correct'" class="ok">正确！</p>
    <p v-else-if="feedback === 'wrong'" class="err">不对哦～</p>

    <p v-if="showAnswer">答案是: {{ correctValue }}</p>
  </section>
</template>

<style scoped>
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
</style>
