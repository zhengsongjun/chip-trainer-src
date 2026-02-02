<script setup lang="ts">
  import { watch } from 'vue'
  import ChipStack from './ChipStack.vue'
  export interface ChipGroup {
    color: string
    count: number
  }

  const props = defineProps<{
    groups: ChipGroup[]
  }>()
  watch(props, () => {
    console.log(props.groups)
  })
</script>

<template>
  <section class="chip-board">
    <div class="chip-stacks">
      <div
        v-for="(group, idx) in props.groups"
        :key="`${group.color}-${group.count}-${idx}`"
        class="chip-stack"
      >
        <ChipStack :color="group.color" :count="group.count" :size="72" :spacing="10" />
      </div>
    </div>
  </section>
</template>

<style scoped>
  /* 舞台核心区域 */
  .chip-board {
    margin: var(--space-5) 0;
    display: flex;
    justify-content: center;
  }

  /* 筹码布局 */
  .chip-stacks {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4);
    align-items: flex-end;
    justify-content: center;
  }

  /* 单个筹码堆 */
  .chip-stack {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
</style>
