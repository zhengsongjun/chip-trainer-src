<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import { ElMessage } from 'element-plus'
  import { ArrowDown } from '@element-plus/icons-vue'
  import { useUserStore } from '@/stores/user'

  import zhCn from 'element-plus/es/locale/lang/zh-cn'
  import enUs from 'element-plus/es/locale/lang/en'

  /* ================= router ================= */
  const router = useRouter()
  const route = useRoute()

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

  /* ================= store ================= */
  const userStore = useUserStore()

  /* ================= user basic ================= */
  const userEmail = ref<string | null>(null)
  const userId = ref<string | null>(null)

  /* ================= services from local ================= */
  const SERVICE_LABEL_MAP: Record<string, string> = {
    chipTrainer: '筹码反应训练',
    boardAnalysis: '牌面训练',
    potTrainer: '底池计算训练',
  }

  type LocalService = {
    key: string
    label: string
    expiresAtMs: number
    valid: boolean
  }
  const activeMenu = computed(() => {
    if (route.path.startsWith('/board-analysis')) return '/board-analysis'
    if (route.path.startsWith('/chip-trainer')) return '/chip-trainer'
    if (route.path.startsWith('/pot-trainer')) return '/pot-trainer'
    return route.path
  })
  const userServices = computed<LocalService[]>(() => {
    const services = userStore.profile?.services || {}
    const now = Date.now()

    return Object.keys(services)
      .map((key) => {
        const seconds = services[key]?.expiresAt?.seconds
        if (!seconds) return null

        const expiresAtMs = seconds * 1000

        return {
          key,
          label: SERVICE_LABEL_MAP[key] || key,
          expiresAtMs,
          valid: expiresAtMs > now,
        }
      })
      .filter(Boolean) as LocalService[]
  })

  const hasValidService = computed(() => {
    return userServices.value.some((s) => s.valid)
  })

  const serviceValidMap = computed(() => {
    const map = userServices.value.reduce<Record<string, boolean>>((acc, s) => {
      acc[s.key] = s.valid
      return acc
    }, {})

    // 管理员拥有所有服务的访问权限
    if (userStore.profile?.role === 'admin') {
      map.chipTrainer = true
      map.boardAnalysis = true
      map.potTrainer = true
    }

    return map
  })

  /* ================= sidebar ================= */
  const showSidebar = computed(() => {
    return route.meta.layout !== 'simple' && hasValidService.value
  })

  /* ================= auth ================= */
  async function handleLogout() {
    userStore.reset()
    ElMessage.success('已退出登录')
    router.push('/login')
  }

  /* ================= i18n ================= */
  const { locale, t } = useI18n()
  const elementLocale = computed(() => (locale.value === 'en-US' ? enUs : zhCn))

  /* ================= watch ================= */
  watch(
    () => userStore.profile,
    (profile) => {
      userEmail.value = profile?.email ?? null
      userId.value = profile?.uid ?? null
    },
    { immediate: true }
  )

  watch(
    () => ({
      profile: userStore.profile,
      hasService: hasValidService.value,
      path: route.path,
    }),
    ({ profile, hasService, path }) => {
      // 1️⃣ 未登录，不管（路由守卫会处理）
      if (!profile) return

      // 2️⃣ 管理员永远放行
      if (profile.role === 'admin') return

      // 3️⃣ 已经在 profile 页，别跳，防止死循环
      if (path === '/profile') return

      // 4️⃣ 没有任何有效服务 → 强制去 profile
      if (!hasService) {
        router.replace('/profile')
      }
    },
    { immediate: true }
  )
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
                    （至
                    {{ new Date(service.expiresAtMs).toISOString().slice(0, 10) }}）
                  </el-dropdown-item>

                  <el-dropdown-item v-if="!userServices.length" disabled>
                    暂无激活服务
                  </el-dropdown-item>

                  <el-dropdown-item divided @click="goProfile"> 个人中心 </el-dropdown-item>

                  <el-dropdown-item
                    v-if="userStore.profile?.role === 'admin'"
                    @click="goActivationPage"
                  >
                    管理员页面
                  </el-dropdown-item>

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
          <el-menu router class="ui-menu" :default-active="activeMenu">
            <el-menu-item v-if="serviceValidMap.chipTrainer" index="/chip-trainer">
              筹码反应训练
            </el-menu-item>

            <el-menu-item v-if="serviceValidMap.boardAnalysis" index="/board-analysis">
              牌面分析训练
            </el-menu-item>

            <el-menu-item
              v-if="serviceValidMap.potTrainer && userStore.profile?.role === 'admin'"
              index="/pot-trainer"
            >
              底池计算训练
            </el-menu-item>
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
