<template>
  <div
    class="card card-face"
    :style="{
      transform: `scale(${Number(scale)})`,
    }"
  >
    <img :src="cardSrc" alt="card face" />
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  const props = defineProps<{
    card: string
    scale?: string | number
  }>()

  const scale = props.scale ?? 1

  const cardSrc = computed(() => {
    const value = props.card.toLowerCase()
    const suitChar = value.slice(-1)
    const rankPart = value.slice(0, -1)

    const suitMap: Record<string, string> = {
      s: 'spades',
      h: 'hearts',
      d: 'diamonds',
      c: 'clubs',
    }

    const suit = suitMap[suitChar]

    const rankMap: Record<string, string> = {
      a: '1',
      j: '11',
      q: '12',
      k: '13',
    }

    const rank = rankMap[rankPart] ?? rankPart

    return new URL(`../../assets/cards/${suit}/${rank}.svg`, import.meta.url).href
  })
</script>

<style scoped>
  .card {
    width: 90px;
    height: 130px;
    border-radius: 10px;
    overflow: hidden;
    background: #fff;

    /* 关键：从中心缩放 */
    transform-origin: center center;
  }

  .card img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
</style>
