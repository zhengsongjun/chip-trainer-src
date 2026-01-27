<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { Timestamp } from 'firebase/firestore'
  import { ElMessage } from 'element-plus'
  import { auth, db } from '@/firebase'
  import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
  import { onAuthStateChanged } from 'firebase/auth'
  import img from '@/assets/bg/reg.png'

  /* ================= 用户 ================= */
  const email = ref<string | null>(null)
  const userId = ref<string | null>(null)

  /* ================= 服务 ================= */
  type ServiceItem = {
    name: string
    expiresAt: string
  }
  const services = ref<ServiceItem[]>([])

  /* ================= 弹窗 ================= */
  const dialogVisible = ref(false)
  const activationCode = ref('')
  const activating = ref(false)

  onMounted(() => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) return
      email.value = user.email
      userId.value = user.uid
      await loadUserServices()
    })
  })

  /* ================= 读取服务 ================= */
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

  /* ================= 激活 ================= */
  function openActivateDialog() {
    activationCode.value = ''
    dialogVisible.value = true
  }
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

      // ⭐ 新逻辑：支持 day / month
      const duration = codeData.duration
      const durationMs =
        typeof duration === 'object' && duration.durationMs
          ? duration.durationMs
          : duration * 30 * 24 * 60 * 60 * 1000 // 兼容旧数据

      codeData.services.forEach((service: string) => {
        const currentExpire = newServices[service]?.expiresAt?.toDate?.()
        const baseTime =
          currentExpire && currentExpire.getTime() > now.getTime()
            ? currentExpire.getTime()
            : now.getTime()

        const newExpire = new Date(baseTime + durationMs)

        newServices[service] = {
          expiresAt: Timestamp.fromDate(newExpire),
        }
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
      console.error(e)
      ElMessage.error('激活失败')
    } finally {
      activating.value = false
    }
  }
</script>

<template>
  <div class="ui-panel">
    <div class="section-header">
      <h2 class="section-title">已激活服务</h2>
      <el-button type="primary" size="small" @click="openActivateDialog"> 激活服务 </el-button>
    </div>

    <el-table v-if="services.length" :data="services">
      <el-table-column prop="name" label="服务名称" />
      <el-table-column prop="expiresAt" label="到期时间" />
    </el-table>
    <div v-else class="empty-wrapper">
      <div class="wechat-box">
        <p class="wechat-text">暂无服务,添加微信获取服务</p>
        <img class="wechat-img" :src="img" alt="微信二维码" />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" title="激活服务" width="420px" destroy-on-close>
      <el-input v-model="activationCode" placeholder="请输入激活码" size="large" />
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="activating" @click="handleActivate"> 激活 </el-button>
      </template>
    </el-dialog>
  </div>
</template>
<style scoped>
  .empty-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px 0;
  }

  .wechat-box {
    margin-top: 16px;
    text-align: center;
  }

  .wechat-text {
    font-size: 14px;
    color: #606266;
    margin-bottom: 8px;
  }

  .wechat-img {
    width: 160px;
    height: 160px;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
</style>
