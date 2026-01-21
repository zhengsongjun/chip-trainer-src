<template>
  <div
    class="card-stack"
    :style="{
      transform: `scale(${scale})`,
    }"
  >
    <div
      v-for="i in count"
      :key="i"
      class="card-layer"
      :style="{
        top: `${i * offset}px`,
        left: `${i * offset}px`,
        zIndex: i,
      }"
    >
      <img :src="backImg" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import backImg from '@/assets/bg/poke.png'

  defineProps<{
    count?: number
    offset?: number
    scale?: number
  }>()
</script>

<script lang="ts">
  export default {
    props: {
      count: { type: Number, default: 14 },
      offset: { type: Number, default: 1.4 },
      scale: { type: Number, default: 1 },
    },
  }
</script>

<style scoped>
  .card-stack {
    position: relative;
    width: 120px;
    height: 160px;
    transform-origin: center center;
  }

  .card-layer {
    position: absolute;
    width: 90px;
    height: 130px;
    border-radius: 10px;
    overflow: hidden;
    background: white;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  }

  .card-layer img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
</style>
