<!-- src/components/ChipStack.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import Chip from './Chip.vue'

type Angle = 'ang1' | 'ang2' | 'ang3' | 'ang4'
type Color = 'red' | 'white' | 'green' | 'black'

const props = defineProps<{
  color: Color
  count?: number
  size?: number
  spacing?: number  // 每层垂直间距(px)
  angles?: Angle[]
  seed?: number | string  // 提供则随机可复现
  allowRepeat?: boolean   // 是否允许四个角度在一个小周期内重复
  jitterX?: number        // 水平抖动最大幅度(px)，默认 size*0.06
}>()

const count   = computed(() => props.count ?? 5)
const size    = computed(() => props.size ?? 64)
const spacing = computed(() => props.spacing ?? 8)
const anglePool = computed<Angle[]>(() => props.angles ?? ['ang1','ang2','ang3','ang4'])

function seededRng(seedVal: number) {
  // mulberry32：简洁稳定的可复现 RNG
  let t = seedVal >>> 0
  return () => {
    t += 0x6D2B79F5
    let s = Math.imul(t ^ (t >>> 15), 1 | t)
    s ^= s + Math.imul(s ^ (s >>> 7), 61 | s)
    return ((s ^ (s >>> 14)) >>> 0) / 4294967296
  }
}
const rng = computed(() => {
  let s = typeof props.seed === 'string'
    ? [...props.seed].reduce((a, c) => a + c.charCodeAt(0), 0)
    : (props.seed ?? Date.now())
  return seededRng(Number(s))
})

const layers = computed(() => {
  const r = rng.value
  const res: Array<{ angle: Angle; jitterX: number }> = []
  const pool = [...anglePool.value]
  const jitterMax = 0

  for (let i = 0; i < count.value; i++) {
    let angle: Angle
    if (!props.allowRepeat && pool.length) {
      angle = pool.splice(Math.floor(r() * pool.length), 1)[0]!
      if (pool.length === 0) pool.push(...anglePool.value) // 用完就补回
    } else {
      angle = anglePool.value[Math.floor(r() * anglePool.value.length)]
    }
    const jitterX = 0
    res.push({ angle, jitterX })
  }
  return res
})

const height = computed(() => size.value + (count.value - 1) * spacing.value)
</script>

<template>
  <div class="chip-stack"
       :style="{ width: size + 'px', height: height + 'px' }"
       role="img"
       :aria-label="`stack of ${count} ${color} chips`">

    <div v-for="(item, i) in layers"
         :key="i"
         class="chip-layer"
         :style="{
            bottom: (i * spacing) + 'px',
            zIndex: 1000 + i,
            transform: `translate(0px, ${2 * i}px)`
          }"
          >
      <Chip :color="color" :angle="item.angle" :size="size" :shadow="true" />
    </div>
  </div>
</template>

<style scoped>
.chip-stack {
  position: relative;
  touch-action: manipulation;

  /* 可选：父级控制整体缩放适配容器 */
}
.chip-layer {
  position: absolute;
  will-change: transform;
  /* 这里用 left/bottom 定位，避免频繁 transform 合成层开销；
     如果需要动画再换 transform。 */
}
</style>
