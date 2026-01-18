<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import { ElConfigProvider, ElMessage, ElMessageBox } from 'element-plus'
  import { ArrowDown } from '@element-plus/icons-vue'

  import zhCn from 'element-plus/es/locale/lang/zh-cn'
  import enUs from 'element-plus/es/locale/lang/en'

  import { onAuthStateChanged } from 'firebase/auth'
  import { collection, deleteDoc, doc, getDoc, getDocs } from 'firebase/firestore'
  import { auth, db } from '@/firebase'
  import { logout } from '@/services/auth'

  /* ================= router ================= */
  const router = useRouter()

  async function clearAllTestData() {
    try {
      await ElMessageBox.confirm(
        '⚠️ 此操作将清空所有激活码和用户服务数据，且不可恢复，是否继续？',
        '危险操作确认',
        {
          type: 'error',
          confirmButtonText: '确认清空',
          cancelButtonText: '取消',
        }
      )

      // 1️⃣ 清空 activation_codes
      const codeSnap = await getDocs(collection(db, 'activation_codes'))
      const deleteCodeTasks = codeSnap.docs.map((d) => deleteDoc(doc(db, 'activation_codes', d.id)))
      await Promise.all(deleteCodeTasks)

      // 2️⃣ 清空 user_activation_service
      const serviceSnap = await getDocs(collection(db, 'user_activation_service'))
      const deleteServiceTasks = serviceSnap.docs.map((d) =>
        deleteDoc(doc(db, 'user_activation_service', d.id))
      )
      await Promise.all(deleteServiceTasks)

      ElMessage.success('已清空所有测试数据')
    } catch (e) {
      // 用户取消，不提示错误
    }
  }

  function goProfile() {
    router.push('/profile')
  }

  function goHome() {
    router.push('/chip-trainer')
  }

  function goActivationPage() {
    router.push('/activation')
  }

  function goLogin() {
    router.push('/login')
  }

  /* ================= auth ================= */
  const userEmail = ref<string | null>(null)
  const userId = ref<string | null>(null)

  /* ================= services ================= */
  type UserService = {
    key: string
    label: string
    expiresAt: Date
  }

  const userServices = ref<UserService[]>([])

  const SERVICE_LABEL_MAP: Record<string, string> = {
    chipTrainer: '筹码反应训练',
    faceTrainer: '牌面训练',
  }

  /* 是否有至少一个未过期服务 */
  const hasValidService = computed(() => {
    const now = new Date()
    return userServices.value.some((s) => s.expiresAt > now)
  })

  /* ================= Firestore ================= */
  async function loadUserServices(uid: string) {
    const snap = await getDoc(doc(db, 'user_activation_service', uid))

    if (!snap.exists()) {
      userServices.value = []
      return
    }

    const services = snap.data().services || {}
    const now = new Date()

    userServices.value = Object.keys(services).map((key) => ({
      key,
      label: SERVICE_LABEL_MAP[key] || key,
      expiresAt: services[key].expiresAt.toDate(),
    }))
  }

  /* ================= auth listener ================= */
  onMounted(() => {
    onAuthStateChanged(auth, async (user) => {
      userEmail.value = user ? user.email : null
      userId.value = user ? user.uid : null

      if (user) {
        await loadUserServices(user.uid)
      } else {
        userServices.value = []
      }
    })
  })

  /* ================= logout ================= */
  async function handleLogout() {
    await logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  }

  /* ================= i18n ================= */
  const { locale, t } = useI18n()

  const elementLocale = computed(() => {
    return locale.value === 'en-US' ? enUs : zhCn
  })
</script>

<template>
  <el-config-provider :locale="elementLocale">
    <div class="layout">
      <!-- ================= Header ================= -->
      <header class="header">
        <div class="header-left" @click="goHome">
          <span class="brand">{{ t('app.title') }}</span>
        </div>
        <el-button type="danger" size="small" plain @click="clearAllTestData">
          🧨 清空测试数据
        </el-button>
        <div class="header-right">
          <!-- 语言切换 -->
          <el-select v-model="locale" size="small" class="locale-select">
            <el-option label="简体中文" value="zh-CN" />
            <el-option label="English" value="en-US" />
          </el-select>

          <!-- ================= Auth Area ================= -->
          <div class="auth-area">
            <!-- 未登录 -->
            <el-button v-if="!userEmail" type="primary" size="small" @click="goLogin">
              {{ t('common.login') }}
            </el-button>

            <!-- 已登录 -->
            <el-dropdown v-else trigger="hover">
              <span class="user-trigger">
                <el-avatar size="small" class="avatar">
                  {{ userEmail.charAt(0).toUpperCase() }}
                </el-avatar>
                <span class="email">{{ userEmail }}</span>
                <el-icon>
                  <ArrowDown />
                </el-icon>
              </span>

              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item disabled>
                    {{ userEmail }}
                  </el-dropdown-item>

                  <el-dropdown-item disabled> 已激活服务 </el-dropdown-item>

                  <el-dropdown-item v-for="service in userServices" :key="service.key" disabled>
                    {{ service.label }}
                    （至 {{ service.expiresAt.toISOString().slice(0, 10) }}）
                  </el-dropdown-item>

                  <el-dropdown-item v-if="!userServices.length" disabled>
                    暂无激活服务
                  </el-dropdown-item>

                  <el-dropdown-item divided @click="goProfile"> 个人中心 </el-dropdown-item>

                  <el-dropdown-item @click="goActivationPage"> 激活码生成 </el-dropdown-item>

                  <el-dropdown-item divided @click="handleLogout"> 退出登录 </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </header>

      <!-- ================= Main ================= -->
      <div class="main">
        <!-- ✅ 只有有有效服务才渲染侧边栏 -->
        <aside v-if="hasValidService" class="sidebar">
          <el-menu router default-active="/chip-trainer" class="menu">
            <el-menu-item index="/chip-trainer">
              {{ t('menu.chipTrainer') }}
            </el-menu-item>
            <el-menu-item index="/chip-trainer"> 第二项服务 </el-menu-item>
          </el-menu>
        </aside>

        <main class="content">
          <router-view />
        </main>
      </div>
    </div>
  </el-config-provider>
</template>

<style scoped>
  .layout {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: var(--el-bg-color-page);
  }

  .header {
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    background-color: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color-light);
  }

  .header-left {
    cursor: pointer;
  }

  .brand {
    font-size: 18px;
    font-weight: 600;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .locale-select {
    width: 110px;
  }

  .auth-area {
    display: flex;
    align-items: center;
  }

  .user-trigger {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }

  .avatar {
    background-color: var(--el-color-primary);
    color: #fff;
    font-size: 12px;
  }

  .email {
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
  }

  .main {
    flex: 1;
    display: flex;
    min-height: 0;
  }

  .sidebar {
    width: 200px;
    background-color: var(--el-bg-color);
    border-right: 1px solid var(--el-border-color-light);
  }

  .menu {
    border-right: none;
  }

  .content {
    flex: 1;
    padding: 16px;
    overflow: auto;
  }
</style>
