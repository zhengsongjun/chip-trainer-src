<template>
  <div class="card card-back">
    <img :src="backImg" alt="card back" />
  </div>
</template>

<script setup lang="ts">
  import backImg from '@/assets/bg/poke.png'
</script>

<style scoped>
  .card {
    width: 90px;
    height: 130px;
    overflow: hidden;
  }

  .card img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
</style>
