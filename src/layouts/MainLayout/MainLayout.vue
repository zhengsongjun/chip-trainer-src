<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import { ElConfigProvider, ElMessage } from 'element-plus'
  import { ArrowDown } from '@element-plus/icons-vue'

  import zhCn from 'element-plus/es/locale/lang/zh-cn'
  import enUs from 'element-plus/es/locale/lang/en'

  import { onAuthStateChanged } from 'firebase/auth'
  import { auth } from '@/firebase'
  import { logout } from '@/services/auth'

  /* ================= router ================= */
  const router = useRouter()

  function goHome() {
    router.push('/chip-trainer')
  }

  function goLogin() {
    router.push('/login')
  }

  /* ================= auth ================= */
  const userEmail = ref<string | null>(null)

  onMounted(() => {
    onAuthStateChanged(auth, (user) => {
      userEmail.value = user ? user.email : null
    })
  })

  async function handleLogout() {
    await logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  }

  /* ================= i18n ================= */
  const { locale, t } = useI18n()

  /* ================= Element Plus locale ================= */
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
                  <el-dropdown-item divided @click="handleLogout"> 退出登录 </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </header>

      <!-- ================= Main ================= -->
      <div class="main">
        <aside class="sidebar">
          <el-menu router default-active="/chip-trainer" class="menu">
            <el-menu-item index="/chip-trainer">
              {{ t('menu.chipTrainer') }}
            </el-menu-item>
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

  /* ================= Header ================= */
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
    color: var(--el-text-color-primary);
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .locale-select {
    width: 110px;
  }

  /* ================= Auth ================= */
  .auth-area {
    display: flex;
    align-items: center;
  }

  .user-trigger {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    color: var(--el-text-color-primary);
  }

  .user-trigger:hover {
    color: var(--el-color-primary);
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

  /* ================= Main ================= */
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
