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

  import PinkAng1 from '@/assets/cheques/pink/ang1.svg?component'
  import PinkAng2 from '@/assets/cheques/pink/ang2.svg?component'
  import PinkAng3 from '@/assets/cheques/pink/ang3.svg?component'
  import PinkAng4 from '@/assets/cheques/pink/ang4.svg?component'

  import purpleAng1 from '@/assets/cheques/purple/ang1.svg?component'
  import purpleAng2 from '@/assets/cheques/purple/ang2.svg?component'
  import purpleAng3 from '@/assets/cheques/purple/ang3.svg?component'
  import purpleAng4 from '@/assets/cheques/purple/ang4.svg?component'

  import brownAng1 from '@/assets/cheques/brown/ang1.svg?component'
  import brownAng2 from '@/assets/cheques/brown/ang2.svg?component'
  import brownAng3 from '@/assets/cheques/brown/ang3.svg?component'
  import brownAng4 from '@/assets/cheques/brown/ang4.svg?component'

  //锦标赛
  import grey5mAng1 from '@/assets/chips/grey5m/ang1.svg?component'
  import grey5mAng2 from '@/assets/chips/grey5m/ang2.svg?component'
  import grey5mAng3 from '@/assets/chips/grey5m/ang3.svg?component'
  import grey5mAng4 from '@/assets/chips/grey5m/ang4.svg?component'

  import orange1mAng1 from '@/assets/chips/orange1m/ang1.svg?component'
  import orange1mAng2 from '@/assets/chips/orange1m/ang2.svg?component'
  import orange1mAng3 from '@/assets/chips/orange1m/ang3.svg?component'
  import orange1mAng4 from '@/assets/chips/orange1m/ang4.svg?component'

  import Blue100kAng1 from '@/assets/chips/blue100k/ang1.svg?component'
  import Blue100kAng2 from '@/assets/chips/blue100k/ang2.svg?component'
  import Blue100kAng3 from '@/assets/chips/blue100k/ang3.svg?component'
  import Blue100kAng4 from '@/assets/chips/blue100k/ang4.svg?component'
  // 绿色
  import Green25kAng1 from '@/assets/chips/green25k/ang1.svg?component'
  import Green25kAng2 from '@/assets/chips/green25k/ang2.svg?component'
  import Green25kAng3 from '@/assets/chips/green25k/ang3.svg?component'
  import Green25kAng4 from '@/assets/chips/green25k/ang4.svg?component'
  // 红色
  import Red5kAng1 from '@/assets/chips/red5k/ang1.svg?component'
  import Red5kAng2 from '@/assets/chips/red5k/ang2.svg?component'
  import Red5kAng3 from '@/assets/chips/red5k/ang3.svg?component'
  import Red5kAng4 from '@/assets/chips/red5k/ang4.svg?component'

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
  type CashColor = 'white1' | 'red5' | 'green25' | 'black100' | 'pink2' | 'purple500' | 'brown3'
  type TournamentColor =
    | 'red5k'
    | 'green25k'
    | 'yellow1k'
    | 'purple500'
    | 'black100'
    | 'grey5m'
    | 'orange1m'
    | 'blue100k'
  type Color = CashColor | TournamentColor

  const props = defineProps<{
    color: Color
    angle: Angle
    size?: number
  }>()

  const size = computed(() => props.size ?? 64)

  // 映射：不同颜色 -> 不同角度的图
  const mapByColor: Partial<Record<string, Record<Angle, any>>> = {
    /* ===== 现金赛 cheques ===== */
    white1: {
      ang1: WhiteAng1,
      ang2: WhiteAng2,
      ang3: WhiteAng3,
      ang4: WhiteAng4,
    },
    red5: {
      ang1: RedAng1,
      ang2: RedAng2,
      ang3: RedAng3,
      ang4: RedAng4,
    },
    green25: {
      ang1: GreenAng1,
      ang2: GreenAng2,
      ang3: GreenAng3,
      ang4: GreenAng4,
    },
    black100: {
      ang1: BlackAng1,
      ang2: BlackAng2,
      ang3: BlackAng3,
      ang4: BlackAng4,
    },
    pink2: {
      ang1: PinkAng1,
      ang2: PinkAng2,
      ang3: PinkAng3,
      ang4: PinkAng4,
    },
    purple500: {
      ang1: purpleAng1,
      ang2: purpleAng2,
      ang3: purpleAng3,
      ang4: purpleAng4,
    },
    brown3: {
      ang1: brownAng1,
      ang2: brownAng2,
      ang3: brownAng3,
      ang4: brownAng4,
    },

    /* ===== 锦标赛 chips ===== */
    grey5m: {
      ang1: grey5mAng1,
      ang2: grey5mAng2,
      ang3: grey5mAng3,
      ang4: grey5mAng4,
    },
    orange1m: {
      ang1: orange1mAng1,
      ang2: orange1mAng2,
      ang3: orange1mAng3,
      ang4: orange1mAng4,
    },
    blue100k: {
      ang1: Blue100kAng1,
      ang2: Blue100kAng2,
      ang3: Blue100kAng3,
      ang4: Blue100kAng4,
    },
    green25k: {
      ang1: Green25kAng1,
      ang2: Green25kAng2,
      ang3: Green25kAng3,
      ang4: Green25kAng4,
    },
    red5k: {
      ang1: Red5kAng1,
      ang2: Red5kAng2,
      ang3: Red5kAng3,
      ang4: Red5kAng4,
    },
    yellow1k: {
      ang1: YellowAng1,
      ang2: YellowAng2,
      ang3: YellowAng3,
      ang4: YellowAng4,
    },
    purple500: {
      ang1: PurpleAng1,
      ang2: PurpleAng2,
      ang3: PurpleAng3,
      ang4: PurpleAng4,
    },
    black100: {
      ang1: TourBlackAng1,
      ang2: TourBlackAng2,
      ang3: TourBlackAng3,
      ang4: TourBlackAng4,
    },
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
  .chip {
    position: relative;
    display: block;
  }
  .chip-svg {
    width: 100%;
    height: 100%;
    display: block;
  }
</style>
