<template>
  <div class="not-found">
    <h1>404</h1>
    <p>页面不存在</p>

    <el-button type="primary" @click="$router.push('/profile')"> 个人中心页面 </el-button>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
  .not-found {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 16px;
  }

  h1 {
    font-size: 64px;
    margin: 0;
  }
</style>
