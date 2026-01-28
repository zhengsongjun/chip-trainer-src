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
  const pageLoading = ref(true)
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
      if (!user) {
        pageLoading.value = false
        return
      }

      email.value = user.email
      userId.value = user.uid

      try {
        await loadUserServices()
      } finally {
        pageLoading.value = false
      }
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
  <div class="ui-panel" v-loading="pageLoading">
    <div class="section-header" v-if="services.length">
      <div class="section-title-wrap">
        <h2 class="section-title">已激活服务</h2>
        <span class="section-desc">查看当前账号已开通的功能</span>
      </div>

      <el-button type="primary" size="default" @click="openActivateDialog"> 激活服务 </el-button>
    </div>

    <el-table v-if="services.length" :data="services">
      <el-table-column prop="name" label="服务名称" />
      <el-table-column prop="expiresAt" label="到期时间" />
    </el-table>
    <div v-else class="empty-wrapper">
      <div class="wechat-box">
        <p class="wechat-text">暂无已激活服务</p>
        <p class="wechat-sub">添加微信获取服务支持</p>
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
    justify-content: center;
  }

  .wechat-box {
    background: #fff;
    padding: 0px 40px;
    border-radius: 12px;
    text-align: center;
  }

  .wechat-text {
    font-size: 16px;
    font-weight: 500;
    color: #303133;
    margin-bottom: 4px;
  }

  .wechat-sub {
    font-size: 13px;
    color: #909399;
    margin-bottom: 20px;
  }

  .wechat-img {
    height: 454px;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  /* 左侧标题区 */
  .section-title-wrap {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .section-title {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
    line-height: 1.2;
    margin: 0;
  }

  .section-desc {
    font-size: 13px;
    color: #909399;
  }

  /* 右侧按钮 */
  .section-header .el-button {
    padding: 8px 16px;
    font-weight: 500;
  }
</style>
