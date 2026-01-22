<template>
  <div
    class="card card-face"
    :class="{
      'highlight-high': isHighlightHigh,
      'highlight-low': isHighlightLow,
      dim: isDim,
    }"
    :style="{
      transform: `scale(${Number(scale)})`,
    }"
  >
    <img :src="cardSrc" alt="card face" draggable="false" @dragstart.prevent />
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  const props = defineProps<{
    card: string
    scale?: string | number

    /**
     * 当前这张牌是否属于被 High Chip 选中的玩家
     */
    active?: boolean

    /**
     * 当前这张牌是否属于被 Low Chip 选中的玩家
     */
    activeLow?: boolean

    /**
     * 当前是否存在"任何玩家被选中"
     * 用于区分：平常 vs 暗淡
     */
    hasSelection: boolean
  }>()

  const scale = props.scale ?? 1

  /**
   * 高亮判定
   */
  const isHighlightHigh = computed(() => props.active === true)
  const isHighlightLow = computed(() => props.activeLow === true)

  const isDim = computed(() => {
    // 只有在"存在选择"的情况下
    // 且自己不是 active 或 activeLow，才暗淡
    return props.hasSelection && props.active !== true && props.activeLow !== true
  })

  const cardSrc = computed(() => {
    if (!props.card || typeof props.card !== 'string') {
      console.warn('[CardFace] invalid card:', props.card)
      return ''
    }

    const value = props.card.trim().toLowerCase()

    // 提取花色（支持字母 & 符号）
    const suitMap: Record<string, string> = {
      s: 'spades',
      h: 'hearts',
      d: 'diamonds',
      c: 'clubs',
      '♠': 'spades',
      '♥': 'hearts',
      '♦': 'diamonds',
      '♣': 'clubs',
    }

    const suitChar = value.slice(-1)
    const suit = suitMap[suitChar]

    // 提取 rank
    const rawRank = value.slice(0, -1)

    const rankMap: Record<string, string> = {
      a: '1',
      k: '13',
      q: '12',
      j: '11',
      t: '10',
      '10': '10',
      '9': '9',
      '8': '8',
      '7': '7',
      '6': '6',
      '5': '5',
      '4': '4',
      '3': '3',
      '2': '2',
    }

    const rank = rankMap[rawRank]

    if (!suit || !rank) {
      console.warn('[CardFace] parse failed:', props.card)
      return ''
    }

    return new URL(`../../assets/cards/${suit}/${rank}.svg`, import.meta.url).href
  })
</script>

<style scoped>
  /* ===============================
 基础状态（平常）
 =============================== */

  .card {
    width: 90px;
    height: 130px;
    overflow: visible;

    transform-origin: center center;

    transition:
      box-shadow 0.2s ease,
      filter 0.2s ease;
  }

  .card img {
    width: 100%;
    height: 100%;
    object-fit: fill;
    user-select: none;
    -webkit-user-drag: none;
    -moz-user-select: none;
    -webkit-user-select: none;
    -ms-user-select: none;
  }

  /* ===============================
 高光状态（被选中的玩家）
 =============================== */

  .card.highlight-high {
    box-shadow:
      0 0 0 3px #d4af37,
      /* 金色镶边 */ 0 6px 18px rgba(212, 175, 55, 0.55);
    filter: brightness(1.05) contrast(1.05);
  }

  .card.highlight-low {
    box-shadow:
      0 0 0 3px #1e88e5,
      /* 蓝色镶边 */ 0 6px 18px rgba(30, 136, 229, 0.55);
    filter: brightness(1.05) contrast(1.05);
  }

  /* ===============================
 暗淡状态（未被选中的玩家）
 ❗ 不改变 opacity
 =============================== */

  .card.dim {
    filter: brightness(0.55) saturate(0.7);
  }
</style>
