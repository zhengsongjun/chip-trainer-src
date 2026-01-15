<script setup lang="ts">
import ChipStack from '@/components/ChipStack.vue'

interface ChipGroup {
  color: string
  count: number
}

defineProps<{
  groups: ChipGroup[]
}>()
</script>

<template>
  <section class="board">
    <div class="stacks">
      <div
        v-for="(group, idx) in groups"
        :key="idx"
        class="stack"
      >
        <ChipStack
          :color="group.color"
          :count="group.count"
          :size="72"
          :spacing="10"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
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
</style>
