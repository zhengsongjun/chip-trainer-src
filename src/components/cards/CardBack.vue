<template>
  <div class="card card-back">
    <img :src="backImg" alt="card back" draggable="false" @dragstart.prevent />
  </div>
</template>

<script setup lang="ts">
  import backImg from '@/assets/cards/card back/card back.svg?url'
</script>

<style scoped>
  .card {
    width: 90px;
    height: 130px;
    overflow: visible;
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
</style>
