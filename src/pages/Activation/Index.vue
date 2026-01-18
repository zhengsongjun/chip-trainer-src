<script setup lang="ts">
  import { ref } from 'vue'
  import ActivationCode from './components/ActivationCode.vue'
  import UserServiceAdmin from './components/UserServiceAdmin.vue'

  const activeTab = ref<'codes' | 'admin'>('codes')
</script>

<template>
  <el-tabs v-model="activeTab">
    <el-tab-pane label="激活码管理" name="codes">
      <ActivationCode />
    </el-tab-pane>

    <el-tab-pane label="管理员调整" name="admin">
      <UserServiceAdmin />
    </el-tab-pane>
  </el-tabs>
</template>
