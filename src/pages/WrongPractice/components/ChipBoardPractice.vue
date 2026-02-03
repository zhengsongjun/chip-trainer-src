<script setup lang="ts">
  import { ref, watch } from 'vue'
  import ChipBoard, { type ChipGroup } from '@/pages/ChipTrainer/components/ChipBoard.vue'

  const props = defineProps<{
    groups: ChipGroup[]
  }>()

  const emit = defineEmits<{
    (e: 'confirm', value: string): void
  }>()

  const inputValue = ref('')

  function onSubmit() {
    emit('confirm', inputValue.value)
  }
</script>

<template>
  <div class="practice-panel">
    <ChipBoard :groups="props.groups" />
    <div class="input-area">
      <input
        style="width: 200px"
        v-model="inputValue"
        type="text"
        class="text-input"
        placeholder="请输入内容"
      />
      <button class="submit-btn" @click="onSubmit">提交</button>
    </div>
  </div>
</template>

<style scoped>
  .practice-panel {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .input-area {
    display: flex;
    justify-content: center;
    gap: 12px;
    align-items: center;
  }

  .text-input {
    padding: 8px 10px;
    border-radius: 8px;
    border: 1px solid #dcdfe6;
    font-size: 14px;
  }

  .submit-btn {
    padding: 8px 16px;
    border-radius: 8px;
    border: none;
    background: #409eff;
    color: #fff;
    font-size: 14px;
    cursor: pointer;
  }

  .submit-btn:hover {
    background: #337ecc;
  }
</style>
