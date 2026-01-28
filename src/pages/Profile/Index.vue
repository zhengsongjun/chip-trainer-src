<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { auth } from '@/firebase'
  import { onAuthStateChanged } from 'firebase/auth'

  import ActivatedServices from './components/ActivatedServices.vue'
  import TrainingStats from './components/TrainingStats/TrainingStats.vue'

  /* ================= 用户信息 ================= */
  const email = ref<string | null>(null)

  onMounted(() => {
    onAuthStateChanged(auth, (user) => {
      email.value = user?.email ?? null
    })
  })
</script>

<template>
  <div class="ui-page">
    <div class="ui-stage">
      <div class="ui-content-column profile-page">
        <!-- ================= 账户信息 ================= -->
        <div class="ui-panel">
          <h2 class="section-title">账户信息</h2>

          <el-descriptions :column="1" border>
            <el-descriptions-item label="邮箱">
              {{ email }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- ================= Tabs ================= -->
        <div class="ui-panel tab-panel">
          <el-tabs>
            <el-tab-pane label="激活服务">
              <ActivatedServices />
            </el-tab-pane>

            <el-tab-pane label="个人训练统计">
              <TrainingStats />
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .profile-page {
    padding-top: var(--space-6);
    padding-bottom: var(--space-6);
  }

  /* Tabs 外层 panel 间距 */
  .tab-panel {
    margin-top: var(--space-6);
  }

  /* 标题 */
  .section-title {
    font-size: var(--font-size-md);
    font-weight: 600;
  }
</style>
