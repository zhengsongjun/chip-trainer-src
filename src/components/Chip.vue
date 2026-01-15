<!-- src/components/Chip.vue -->
<script setup lang="ts">
import { computed } from 'vue'

// 示例：红色筹码四角度 SVG 组件（你按实际路径替换）
// 现金赛
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

import BlackAng1 from '@/assets/cheques/black/ang1.svg?component'
import BlackAng2 from '@/assets/cheques/black/ang2.svg?component'
import BlackAng3 from '@/assets/cheques/black/ang3.svg?component'
import BlackAng4 from '@/assets/cheques/black/ang4.svg?component'


//锦标赛
// 绿色
import Green25kAng1 from "@/assets/chips/green25k/ang1.svg?component"
import Green25kAng2 from "@/assets/chips/green25k/ang2.svg?component"
import Green25kAng3 from "@/assets/chips/green25k/ang3.svg?component"
import Green25kAng4 from "@/assets/chips/green25k/ang4.svg?component"
// 红色
import Red5kAng1 from "@/assets/chips/red5k/ang1.svg?component"
import Red5kAng2 from "@/assets/chips/red5k/ang2.svg?component"
import Red5kAng3 from "@/assets/chips/red5k/ang3.svg?component"
import Red5kAng4 from "@/assets/chips/red5k/ang4.svg?component"

import YellowAng1 from '@/assets/chips/yellow1k/ang1.svg?component'
import YellowAng2 from '@/assets/chips/yellow1k/ang2.svg?component'
import YellowAng3 from '@/assets/chips/yellow1k/ang3.svg?component'
import YellowAng4 from '@/assets/chips/yellow1k/ang4.svg?component'

import PurpleAng1 from '@/assets/chips/purple500/ang1.svg?component'
import PurpleAng2 from '@/assets/chips/purple500/ang2.svg?component'
import PurpleAng3 from '@/assets/chips/purple500/ang3.svg?component'
import PurpleAng4 from '@/assets/chips/purple500/ang4.svg?component'

import TourBlackAng1 from '@/assets/chips/black100/ang1.svg?component'
import TourBlackAng2 from '@/assets/chips/black100/ang2.svg?component'
import TourBlackAng3 from '@/assets/chips/black100/ang3.svg?component'
import TourBlackAng4 from '@/assets/chips/black100/ang4.svg?component'


type Angle = 'ang1' | 'ang2' | 'ang3' | 'ang4'
type CashColor = 'red' | 'white' | 'green' | 'black'
type TournamentColor = 'red5k' | 'green25k' | 'yellow1k' | 'purple500' | 'black100'
type Color = CashColor & TournamentColor

const props = defineProps<{
  color: Color
  angle: Angle
  size?: number
}>()

const size = computed(() => props.size ?? 64)

// 映射：不同颜色 -> 不同角度的图
// 如果你希望“同一套路径 + 动态换色”，可以把 fill 改成 currentColor，再用 CSS 控色。
const mapByColor: Record<Color, Record<Angle, any>> = {
  black:   { ang1: BlackAng1, ang2: BlackAng2, ang3: BlackAng3, ang4: BlackAng4 },
  white:   { ang1: WhiteAng1, ang2: WhiteAng2, ang3: WhiteAng3, ang4: WhiteAng4 },
  red:  { ang1: RedAng1, ang2: RedAng2, ang3: RedAng3, ang4: RedAng4 },
  green: { ang1: GreenAng1, ang2: GreenAng2, ang3: GreenAng3, ang4: GreenAng4 },
  green25k: { ang1: Green25kAng1, ang2: Green25kAng2, ang3: Green25kAng3, ang4: Green25kAng4 },
  red5k: { ang1: Red5kAng1, ang2: Red5kAng2, ang3: Red5kAng3, ang4: Red5kAng4 },
  yellow1k: { ang1: YellowAng1, ang2: YellowAng2, ang3: YellowAng3, ang4: YellowAng4 },
  purple500: { ang1: PurpleAng1, ang2: PurpleAng2, ang3: PurpleAng3, ang4: PurpleAng4 },
  black100: { ang1: TourBlackAng1, ang2: TourBlackAng2, ang3: TourBlackAng3, ang4: TourBlackAng4 },
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
