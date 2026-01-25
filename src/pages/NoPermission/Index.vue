<template>
  <div class="no-permission">
    <h1>🚫 无访问权限</h1>
    <p>当前服务未激活或已过期</p>
    <el-button type="primary" @click="$router.push('/profile')"> 去激活服务 </el-button>
    <el-button text @click="$router.push('/')"> 返回首页 </el-button>
  </div>
</template>
