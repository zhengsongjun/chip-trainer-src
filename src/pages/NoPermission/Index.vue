<template>
  <div class="state-page">
    <div class="state-code">403</div>

    <div class="state-title">无访问权限</div>

    <div class="state-desc">当前账号没有权限访问该页面</div>

    <div class="state-actions">
      <el-button type="primary" @click="goProfile"> 前往激活服务 </el-button>
      <!-- <el-button text @click="goHome"> 返回首页 </el-button> -->
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router'

  const router = useRouter()

  const goProfile = () => {
    router.push('/profile')
  }

  const goHome = () => {
    router.push('/')
  }
</script>

<style scoped>
  /* ================= 系统状态页（对齐 404） ================= */

  .state-page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    background: var(--color-bg-page);
  }

  /* 大号状态码 */
  .state-code {
    font-size: 96px;
    font-weight: 600;
    line-height: 1;
    color: var(--color-text-primary);
  }

  /* 状态标题 */
  .state-title {
    margin-top: var(--space-2);
    font-size: var(--font-size-md);
    font-weight: 500;
    color: var(--color-text-primary);
  }

  /* 描述 */
  .state-desc {
    margin-top: var(--space-1);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  /* 操作区 */
  .state-actions {
    margin-top: var(--space-4);
    display: flex;
    gap: var(--space-3);
  }
</style>
