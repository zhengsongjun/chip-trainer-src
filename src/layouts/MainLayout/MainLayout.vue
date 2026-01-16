<script setup lang="ts">
  import { computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import { ElConfigProvider } from 'element-plus'

  import zhCn from 'element-plus/es/locale/lang/zh-cn'
  import enUs from 'element-plus/es/locale/lang/en'

  /* ================= router ================= */
  const router = useRouter()

  function goHome() {
    router.push('/chip-trainer')
  }

  function onLogin() {
    console.log('login')
  }

  /* ================= i18n ================= */
  const { locale, t } = useI18n()

  /**
   * 以后你可以把 locale 改成：
   * - pinia 里的用户配置
   * - localStorage
   * 这里不用动 template
   */

  /* ================= Element Plus locale 映射 ================= */
  const elementLocale = computed(() => {
    return locale.value === 'en-US' ? enUs : zhCn
  })
</script>

<template>
  <!-- ⚠️ 关键：用 el-config-provider 包住整个系统 -->
  <el-config-provider :locale="elementLocale">
    <div class="layout">
      <!-- ================= Header ================= -->
      <header class="header">
        <div class="header-left" @click="goHome">
          <span class="brand">{{ t('app.title') }}</span>
        </div>

        <div class="header-right">
          <!-- 语言切换：直接驱动 i18n.locale -->
          <el-select v-model="locale" size="small" class="locale-select">
            <el-option label="简体中文" value="zh-CN"></el-option>
            <el-option label="English" value="en-US"></el-option>
          </el-select>

          <el-button type="primary" size="small" @click="onLogin">
            {{ t('common.login') }}
          </el-button>
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
          <router-view></router-view>
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

  /* ================= Main ================= */
  .main {
    flex: 1;
    display: flex;
    min-height: 0;
  }

  /* ================= Sidebar ================= */
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
