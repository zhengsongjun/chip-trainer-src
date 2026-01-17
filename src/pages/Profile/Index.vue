<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  import { auth } from '@/firebase'

  /* ================= 用户信息 ================= */
  const email = ref<string | null>(null)

  onMounted(() => {
    email.value = auth.currentUser?.email || null
  })

  /* ================= 激活弹窗 ================= */
  const dialogVisible = ref(false)
  const activationCode = ref('')
  const activating = ref(false)

  /* ================= 服务数据（前端模拟） ================= */
  type ServiceItem = {
    name: string
    activatedAt: string
    expiresAt: string
  }

  const services = ref<ServiceItem[]>([
    {
      name: '训练服务 A',
      activatedAt: '2024-01-01',
      expiresAt: '2024-02-01',
    },
  ])

  /* ================= 行为 ================= */
  const openActivateDialog = () => {
    activationCode.value = ''
    dialogVisible.value = true
  }

  const handleActivate = () => {
    if (!activationCode.value) {
      ElMessage.warning('请输入激活码')
      return
    }

    activating.value = true

    // ⏳ 模拟激活请求
    setTimeout(() => {
      services.value.push({
        name: '训练服务（激活码）',
        activatedAt: new Date().toISOString().slice(0, 10),
        expiresAt: '2024-03-01',
      })

      ElMessage.success('激活成功')
      activating.value = false
      dialogVisible.value = false
    }, 800)
  }
</script>

<template>
  <!-- 页面居中容器 -->
  <div class="profile-wrapper">
    <el-card class="profile-card">
      <template #header>
        <span>个人中心</span>
      </template>

      <!-- ================= 基本信息 ================= -->
      <el-descriptions title="账户信息" :column="1" border>
        <el-descriptions-item label="邮箱">
          {{ email }}
        </el-descriptions-item>
      </el-descriptions>

      <el-divider />

      <!-- ================= 服务区域 ================= -->
      <div class="service-header">
        <span class="section-title">已激活服务</span>
        <el-button type="primary" size="small" @click="openActivateDialog"> 激活服务 </el-button>
      </div>

      <el-table v-if="services.length" :data="services" style="width: 100%; margin-top: 12px">
        <el-table-column prop="name" label="服务名称" />
        <el-table-column prop="activatedAt" label="激活时间" />
        <el-table-column prop="expiresAt" label="到期时间" />
      </el-table>

      <el-empty v-else description="暂无已激活服务" style="margin-top: 24px" />
    </el-card>

    <!-- ================= 激活弹窗 ================= -->
    <el-dialog v-model="dialogVisible" title="激活服务" width="400px" destroy-on-close>
      <el-input v-model="activationCode" placeholder="请输入激活码" />

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="activating" @click="handleActivate"> 激活 </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
  /* ================= 页面居中 ================= */
  .profile-wrapper {
    height: calc(100vh - 56px); /* Header 高度 */
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* ================= 卡片 ================= */
  .profile-card {
    width: 900px;
    max-width: 90%;
  }

  /* ================= 辅助样式 ================= */
  .section-title {
    font-size: 16px;
    font-weight: 500;
  }

  .service-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
</style>
