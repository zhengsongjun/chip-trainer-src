<!-- src/components/Chip.vue -->
<script setup lang="ts">
import { computed } from 'vue'

// 示例：红色筹码四角度 SVG 组件（你按实际路径替换）
import WhiteAng1 from '@/assets/cheques/white/ang1.svg?component'
import WhiteAng2 from '@/assets/cheques/white/ang2.svg?component'
import WhiteAng3 from '@/assets/cheques/white/ang3.svg?component'
import WhiteAng4 from '@/assets/cheques/white/ang4.svg?component'

import RedAng1 from '@/assets/cheques/red/ang1.svg?component'
import RedAng2 from '@/assets/cheques/red/ang2.svg?component'
import RedAng3 from '@/assets/cheques/red/ang3.svg?component'
import RedAng4 from '@/assets/cheques/red/ang4.svg?component'

import GreenAng1 from '@/assets/cheques/green/ang1.svg?component'
import GreenAng2 from '@/assets/cheques/green/ang2.svg?component'
import GreenAng3 from '@/assets/cheques/green/ang3.svg?component'
import GreenAng4 from '@/assets/cheques/green/ang4.svg?component'


type Angle = 'ang1' | 'ang2' | 'ang3' | 'ang4'
type Color = 'red' | 'white' | 'green' | 'black' // 你可扩展

const props = defineProps<{
  color: Color
  angle: Angle
  size?: number
}>()

const size = computed(() => props.size ?? 64)

// 映射：不同颜色 -> 不同角度的图
// 如果你希望“同一套路径 + 动态换色”，可以把 fill 改成 currentColor，再用 CSS 控色。
const mapByColor: Record<Color, Record<Angle, any>> = {
  white:   { ang1: WhiteAng1, ang2: WhiteAng2, ang3: WhiteAng3, ang4: WhiteAng4 },
  red:  { ang1: RedAng1, ang2: RedAng2, ang3: RedAng3, ang4: RedAng4 },
  green: { ang1: GreenAng1, ang2: GreenAng2, ang3: GreenAng3, ang4: GreenAng4 },  // TODO
  black: { ang1: RedAng1, ang2: RedAng2, ang3: RedAng3, ang4: RedAng4 },  // TODO
}

const Comp = computed(() => mapByColor[props.color][props.angle])
</script>

<template>
  <div
    class="chip"
    :style="{ width: size + 'px', height: size + 'px' }"
    role="img"
    aria-label="chip"
  >
    <component :is="Comp" class="chip-svg" />
  </div>
</template>

<style scoped>
.chip { position: relative; display: block;  }
.chip-svg { width: 100%; height: 100%; display: block;   }

</style>
