<script setup lang="ts">
  import { ref } from 'vue'
  import ActivationCode from './components/ActivationCode.vue'
  import UserServiceAdmin from './components/UserServiceAdmin.vue'
  import UserRoleManage from './components/UserRoleManage.vue'

  const activeTab = ref<'codes' | 'admin'>('codes')
</script>

<template>
  <div class="ui-page">
    <div class="ui-stage">
      <div class="ui-content-column">
        <div class="ui-panel">
          <el-tabs v-model="activeTab" class="admin-tabs">
            <el-tab-pane label="激活码管理" name="codes">
              <ActivationCode />
            </el-tab-pane>

            <el-tab-pane label="会员功能时间调整" name="admin">
              <UserServiceAdmin />
            </el-tab-pane>

            <el-tab-pane label="指派管理员" name="role">
              <UserRoleManage />
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  /* Tabs 整体不要太“贴边” */
  .admin-tabs {
    --el-tabs-header-height: 44px;
  }

  /* Tab 内容区给一点呼吸感 */
  :deep(.el-tab-pane) {
    padding-top: var(--space-4);
  }
</style>
