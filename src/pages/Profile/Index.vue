<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  import { auth, db } from '@/firebase'
  import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
  import { onAuthStateChanged } from 'firebase/auth'

  /* ================= 用户信息 ================= */
  const email = ref<string | null>(null)
  const userId = ref<string | null>(null)

  onMounted(() => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        email.value = null
        userId.value = null
        return
      }

      email.value = user.email
      userId.value = user.uid
      await loadUserServices()
    })
  })

  /* ================= 弹窗状态 ================= */
  const dialogVisible = ref(false)
  const activationCode = ref('')
  const activating = ref(false)

  /* ================= 服务数据 ================= */
  type ServiceItem = {
    name: string
    expiresAt: string
  }

  const services = ref<ServiceItem[]>([])

  /* ================= 打开弹窗 ================= */
  function openActivateDialog() {
    activationCode.value = ''
    dialogVisible.value = true
  }

  /* ================= 读取用户服务 ================= */
  async function loadUserServices() {
    const snap = await getDoc(doc(db, 'user_activation_service', userId.value!))
    if (!snap.exists()) {
      services.value = []
      return
    }

    const data = snap.data().services || {}
    services.value = Object.keys(data).map((key) => ({
      name: key,
      expiresAt: data[key].expiresAt.toDate().toISOString().slice(0, 10),
    }))
  }

  /* ================= 激活逻辑 ================= */
  async function handleActivate() {
    if (!activationCode.value) {
      ElMessage.warning('请输入激活码')
      return
    }

    activating.value = true

    try {
      const codeRef = doc(db, 'activation_codes', activationCode.value)
      const codeSnap = await getDoc(codeRef)

      if (!codeSnap.exists()) {
        ElMessage.error('激活码不存在')
        return
      }

      const codeData = codeSnap.data()
      if (codeData.isActivated) {
        ElMessage.warning('该激活码已被使用')
        return
      }

      const userServiceRef = doc(db, 'user_activation_service', userId.value!)
      const userSnap = await getDoc(userServiceRef)

      const now = new Date()
      const newServices: any = userSnap.exists() ? { ...(userSnap.data().services || {}) } : {}

      codeData.services.forEach((service: string) => {
        const currentExpire = newServices[service]?.expiresAt?.toDate()
        const baseDate = currentExpire && currentExpire > now ? currentExpire : now
        const newExpire = new Date(baseDate)
        newExpire.setMonth(newExpire.getMonth() + codeData.duration)

        newServices[service] = { expiresAt: newExpire }
      })

      await setDoc(
        userServiceRef,
        {
          email: email.value,
          services: newServices,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )

      await updateDoc(codeRef, {
        isActivated: true,
        activatedAt: serverTimestamp(),
      })

      ElMessage.success('激活成功')
      dialogVisible.value = false
      await loadUserServices()
    } catch (e) {
      ElMessage.error('激活失败，请重试')
    } finally {
      activating.value = false
    }
  }
</script>

<template>
  <div class="ui-page">
    <div class="ui-stage">
      <!-- 👇 关键：信息页内容列 -->
      <div class="ui-content-column profile-page">
        <!-- ========== 账户信息 ========== -->
        <div class="ui-panel">
          <h2 class="section-title">账户信息</h2>

          <el-descriptions :column="1" border>
            <el-descriptions-item label="邮箱">
              {{ email }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- ========== 已激活服务 ========== -->
        <div class="ui-panel service-panel">
          <div class="section-header">
            <h2 class="section-title">已激活服务</h2>
            <el-button type="primary" size="small" @click="openActivateDialog">
              激活服务
            </el-button>
          </div>

          <el-table v-if="services.length" :data="services">
            <el-table-column prop="name" label="服务名称" />
            <el-table-column prop="expiresAt" label="到期时间" />
          </el-table>

          <el-empty v-else description="暂无已激活服务" style="margin-top: var(--space-5)" />
        </div>
      </div>

      <!-- ========== 激活弹窗 ========== -->
      <el-dialog v-model="dialogVisible" title="激活服务" width="420px" destroy-on-close>
        <div class="ui-dialog-body">
          <el-input v-model="activationCode" placeholder="请输入激活码" size="large" />
        </div>

        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="activating" @click="handleActivate"> 激活 </el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<style scoped>
  .service-panel {
    margin-top: var(--space-6);
  }
  .profile-page {
    padding-top: var(--space-6);
    padding-bottom: var(--space-6);
  }

  /* 标题 */
  .section-title {
    font-size: var(--font-size-md);
    font-weight: 600;
  }

  /* 标题 + 操作 */
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
</style>
