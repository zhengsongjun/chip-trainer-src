<script setup lang="ts">
  import { onMounted, ref } from 'vue'

  const props = defineProps<{
    duration?: number // 默认 1000ms
    minParticles?: number
    maxParticles?: number
  }>()

  const emit = defineEmits<{
    (e: 'finished'): void
  }>()

  const particles = ref<any[]>([])

  function rand(min: number, max: number) {
    return Math.random() * (max - min) + min
  }

  onMounted(() => {
    const count = Math.floor(rand(props.minParticles ?? 200, props.maxParticles ?? 400))

    const colors = ['#ff5252', '#ffeb3b', '#ff9800', '#ff1744', '#ffd740', '#ff6f00']

    particles.value = Array.from({ length: count }).map(() => {
      const angle = rand(0, Math.PI * 2)
      const distance = rand(180, 420)

      return {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance * 0.7,
        size: rand(3, 6),
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: rand(0, 120),
        duration: rand(700, 1100),
      }
    })

    setTimeout(() => {
      emit('finished')
    }, props.duration ?? 1000)
  })
</script>

<template>
  <div class="fireworks-heavy">
    <span
      v-for="(p, i) in particles"
      :key="i"
      class="particle"
      :style="{
        width: `${p.size}px`,
        height: `${p.size}px`,
        background: p.color,
        '--x': `${p.x}px`,
        '--y': `${p.y}px`,
        '--delay': `${p.delay}ms`,
        '--duration': `${p.duration}ms`,
      }"
    />
  </div>
</template>

<style scoped>
  .fireworks-heavy {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 9999;
  }

  .particle {
    position: absolute;
    left: 50%;
    top: 40%;
    border-radius: 50%;
    opacity: 0;
    transform: translate(0, 0) scale(1);
    animation: explode var(--duration) cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
    animation-delay: var(--delay);
  }

  @keyframes explode {
    0% {
      opacity: 1;
      transform: translate(0, 0) scale(1);
    }
    70% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translate(var(--x), var(--y)) scale(0.6);
    }
  }
</style>
