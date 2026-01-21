<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { ArrowDown } from '@element-plus/icons-vue'

  import zhCn from 'element-plus/es/locale/lang/zh-cn'
  import enUs from 'element-plus/es/locale/lang/en'

  import { onAuthStateChanged } from 'firebase/auth'
  import { collection, deleteDoc, doc, getDoc, getDocs } from 'firebase/firestore'
  import { auth, db } from '@/firebase'
  import { logout } from '@/services/auth'
  const route = useRoute()

  const showSidebar = computed(() => {
    return route.meta.layout !== 'simple' && hasValidService.value
  })

  /* ================= router ================= */
  const router = useRouter()

  function goHome() {
    router.push('/chip-trainer')
  }
  function goProfile() {
    router.push('/profile')
  }
  function goActivationPage() {
    router.push('/activation')
  }
  function goLogin() {
    router.push('/login')
  }

  /* ================= danger action ================= */
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

      const codeSnap = await getDocs(collection(db, 'activation_codes'))
      await Promise.all(codeSnap.docs.map((d) => deleteDoc(doc(db, 'activation_codes', d.id))))

      const serviceSnap = await getDocs(collection(db, 'user_activation_service'))
      await Promise.all(
        serviceSnap.docs.map((d) => deleteDoc(doc(db, 'user_activation_service', d.id)))
      )

      ElMessage.success('已清空所有测试数据')
    } catch (e) {}
  }

  /* ================= auth ================= */
  const userEmail = ref<string | null>(null)
  const userId = ref<string | null>(null)

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

  const hasValidService = computed(() => {
    const now = new Date()
    return userServices.value.some((s) => s.expiresAt > now)
  })

  async function loadUserServices(uid: string) {
    const snap = await getDoc(doc(db, 'user_activation_service', uid))
    if (!snap.exists()) {
      userServices.value = []
      return
    }

    const services = snap.data().services || {}
    userServices.value = Object.keys(services).map((key) => ({
      key,
      label: SERVICE_LABEL_MAP[key] || key,
      expiresAt: services[key].expiresAt.toDate(),
    }))
  }

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

  async function handleLogout() {
    await logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  }

  /* ================= i18n ================= */
  const { locale, t } = useI18n()
  const elementLocale = computed(() => (locale.value === 'en-US' ? enUs : zhCn))
</script>

<template>
  <el-config-provider :locale="elementLocale">
    <div class="ui-layout">
      <!-- ================= Header ================= -->
      <header class="ui-header">
        <div class="ui-header-left" @click="goHome">
          <span class="ui-brand">{{ t('app.title') }}</span>
        </div>

        <div class="ui-header-right">
          <!-- language -->
          <el-select v-model="locale" size="small" class="ui-locale-select">
            <el-option label="简体中文" value="zh-CN" />
            <el-option label="English" value="en-US" />
          </el-select>

          <!-- danger -->
          <el-button type="danger" size="small" plain @click="clearAllTestData">
            🧨 清空测试数据
          </el-button>

          <!-- auth -->
          <div class="ui-auth-area">
            <el-button v-if="!userEmail" type="primary" size="small" @click="goLogin">
              {{ t('common.login') }}
            </el-button>

            <el-dropdown v-else trigger="hover">
              <span class="ui-user-trigger">
                <el-avatar size="small" class="ui-avatar">
                  {{ userEmail.charAt(0).toUpperCase() }}
                </el-avatar>
                <span class="ui-email">{{ userEmail }}</span>
                <el-icon><ArrowDown /></el-icon>
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
      <div class="ui-main">
        <aside v-if="showSidebar" class="ui-sidebar">
          <el-menu router default-active="/chip-trainer" class="ui-menu">
            <el-menu-item index="/chip-trainer">
              {{ t('menu.chipTrainer') }}
            </el-menu-item>
          </el-menu>
          <el-menu router class="ui-menu">
            <el-menu-item index="/board-analysis"> 牌面分析训练 </el-menu-item>
          </el-menu>
        </aside>

        <main class="ui-content">
          <router-view />
        </main>
      </div>
    </div>
  </el-config-provider>
</template>

<style scoped>
  .ui-layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--color-bg-page);
  }

  /* header */
  .ui-header {
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--space-5);
    background: var(--color-bg-container);
    border-bottom: 1px solid var(--color-gray-200);
  }

  .ui-brand {
    font-size: var(--font-size-md);
    font-weight: 600;
    cursor: pointer;
  }

  .ui-header-right {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .ui-locale-select {
    width: 110px;
  }

  /* auth */
  .ui-auth-area {
    display: flex;
    align-items: center;
  }

  .ui-user-trigger {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    cursor: pointer;
  }

  .ui-avatar {
    background: var(--color-primary);
    color: #fff;
    font-size: var(--font-size-xs);
  }

  .ui-email {
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--font-size-xs);
    color: var(--color-gray-700);
  }

  /* main */
  .ui-main {
    flex: 1;
    display: flex;
    min-height: 0;
  }

  .ui-sidebar {
    width: 200px;
    background: var(--color-bg-container);
    border-right: 1px solid var(--color-gray-200);
  }

  .ui-menu {
    border-right: none;
  }

  .ui-content {
    flex: 1;
    overflow: auto;
  }
</style>
