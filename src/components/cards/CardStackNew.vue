<template>
  <div class="card-stack-new">
    <div
      v-for="i in count"
      :key="i"
      class="card-layer"
      :style="{
        top: `${(i - 1) * offsetY}px`,
        left: `${(i - 1) * offsetX}px`,
        zIndex: i,
      }"
    >
      <img :src="backImg" alt="card back" draggable="false" @dragstart.prevent />
    </div>
  </div>
</template>

<script setup lang="ts">
  import backImg from '@/assets/cards/card back/card back.svg?url'

  defineProps<{
    count?: number
    offsetX?: number
    offsetY?: number
  }>()
</script>

<script lang="ts">
  export default {
    props: {
      count: { type: Number, default: 15 },
      offsetX: { type: Number, default: 1 }, // 水平偏移
      offsetY: { type: Number, default: 2.5 }, // 垂直偏移
    },
  }
</script>

<style scoped>
  .card-stack-new {
    position: relative;
    width: 110px;
    height: 170px;
    transform-origin: center center;
  }

  .card-layer {
    position: absolute;
    width: 90px;
    height: 130px;
    overflow: visible;
  }

  .card-layer img {
    width: 100%;
    height: 100%;
    object-fit: fill;
    display: block;
    user-select: none;
    -webkit-user-drag: none;
    -moz-user-select: none;
    -webkit-user-select: none;
    -ms-user-select: none;
  }
</style>
