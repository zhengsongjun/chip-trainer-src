<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { db } from '@/firebase'
  import {
    collection,
    doc,
    getDocs,
    updateDoc,
    serverTimestamp,
    query,
    where,
    setDoc,
  } from 'firebase/firestore'

  const SERVICE_LABEL_MAP: Record<string, string> = {
    chipTrainer: '筹码反应训练',
    boardAnalysis: '牌面分析',
    potTrainer: '底池计算训练',
  }

  /* ================= 状态 ================= */
  const searchEmail = ref('')
  const currentPage = ref(1)
  const pageSize = ref(10)
  const loading = ref(false)

  type ServiceItem = {
    key: string
    label: string
    expiresAt: string
  }

  type UserRow = {
    userId: string
    email: string
    services: ServiceItem[]
  }

  const users = ref<UserRow[]>([])

  /* ================= 编辑弹窗 ================= */
  const dialogVisible = ref(false)
  const editingUserId = ref('')
  const editingServiceKey = ref('')
  const newExpireDate = ref('')

  /* ================= 批量添加服务 ================= */
  // const batchLoading = ref(false)

  // async function addServiceToAllAdmins() {
  //   try {
  //     await ElMessageBox.confirm(
  //       '确定要给所有管理员添加「底池计算训练」服务吗？到期时间将设置为 2099-12-31。',
  //       '批量添加服务',
  //       { type: 'warning' }
  //     )

  //     batchLoading.value = true

  //     // 1. 获取所有管理员用户
  //     const usersRef = collection(db, 'users')
  //     const adminQuery = query(usersRef, where('role', '==', 'admin'))
  //     const adminSnap = await getDocs(adminQuery)

  //     if (adminSnap.empty) {
  //       ElMessage.warning('未找到管理员用户')
  //       return
  //     }

  //     const adminUids = adminSnap.docs.map((d) => d.id)
  //     const expireDate = new Date('2099-12-31')

  //     // 2. 批量更新每个管理员的服务
  //     const promises = adminUids.map(async (uid) => {
  //       const serviceRef = doc(db, 'user_activation_service', uid)

  //       // 获取用户邮箱
  //       const userDoc = adminSnap.docs.find((d) => d.id === uid)
  //       const email = userDoc?.data().email || ''

  //       // 检查文档是否存在
  //       const serviceSnap = await getDocs(collection(db, 'user_activation_service'))
  //       const existingDoc = serviceSnap.docs.find((d) => d.id === uid)

  //       if (existingDoc) {
  //         // 文档存在，更新
  //         await updateDoc(serviceRef, {
  //           [`services.potTrainer.expiresAt`]: expireDate,
  //           updatedAt: serverTimestamp(),
  //         })
  //       } else {
  //         // 文档不存在，创建
  //         await setDoc(serviceRef, {
  //           email,
  //           services: {
  //             potTrainer: {
  //               expiresAt: expireDate,
  //             },
  //           },
  //           updatedAt: serverTimestamp(),
  //         })
  //       }
  //     })

  //     await Promise.all(promises)

  //     ElMessage.success(`成功为 ${adminUids.length} 位管理员添加了「底池计算训练」服务`)
  //     await fetchUsers()
  //   } catch (err: any) {
  //     if (err !== 'cancel') {
  //       console.error('批量添加服务失败:', err)
  //       ElMessage.error('批量添加服务失败：' + err.message)
  //     }
  //   } finally {
  //     batchLoading.value = false
  //   }
  // }

  /* ================= 读取用户服务 ================= */
  async function fetchUsers() {
    loading.value = true
    users.value = []

    const snap = await getDocs(collection(db, 'user_activation_service'))
    snap.forEach((d) => {
      const data = d.data()
      const services = data.services || {}

      const list: ServiceItem[] = Object.keys(services).map((key) => ({
        key,
        label: SERVICE_LABEL_MAP[key] || key,
        expiresAt: services[key].expiresAt.toDate().toISOString().slice(0, 10),
      }))

      users.value.push({
        userId: d.id,
        email: data.email || '未知邮箱',
        services: list,
      })
    })

    loading.value = false
  }

  /* ================= 搜索 + 分页 ================= */
  const filteredUsers = computed(() => {
    if (!searchEmail.value) return users.value
    return users.value.filter((u) =>
      u.email.toLowerCase().includes(searchEmail.value.toLowerCase())
    )
  })

  const pagedUsers = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    return filteredUsers.value.slice(start, start + pageSize.value)
  })

  /* ================= 编辑 ================= */
  function openEdit(userId: string, serviceKey: string, expiresAt: string) {
    editingUserId.value = userId
    editingServiceKey.value = serviceKey
    newExpireDate.value = expiresAt
    dialogVisible.value = true
  }

  async function saveEdit() {
    await updateDoc(doc(db, 'user_activation_service', editingUserId.value), {
      [`services.${editingServiceKey.value}.expiresAt`]: new Date(newExpireDate.value),
      updatedAt: serverTimestamp(),
    })

    ElMessage.success('服务到期时间已更新')
    dialogVisible.value = false
    fetchUsers()
  }

  onMounted(fetchUsers)
</script>

<template>
  <el-card>
    <template #header>
      <div style="display: flex; justify-content: space-between; align-items: center">
        <span>管理员调整</span>
        <!-- <el-button
          type="primary"
          size="small"
          :loading="batchLoading"
          @click="addServiceToAllAdmins"
        >
          给所有管理员添加「底池计算训练」
        </el-button> -->
      </div>
    </template>

    <el-input
      v-model="searchEmail"
      placeholder="搜索用户邮箱"
      clearable
      style="width: 300px; margin-bottom: 16px"
    />

    <el-table :data="pagedUsers" v-loading="loading">
      <el-table-column prop="email" label="用户邮箱" width="260" />
      <el-table-column label="服务">
        <template #default="{ row }">
          <div v-for="service in row.services" :key="service.key" class="service-row">
            <span> {{ service.label }}（至 {{ service.expiresAt }}） </span>
            <el-button
              size="small"
              text
              @click="openEdit(row.userId, service.key, service.expiresAt)"
            >
              编辑
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      style="margin-top: 16px; justify-content: flex-end"
      background
      layout="prev, pager, next"
      :total="filteredUsers.length"
      :page-size="pageSize"
      v-model:current-page="currentPage"
    />
  </el-card>

  <el-dialog v-model="dialogVisible" title="调整服务到期时间" width="400px">
    <el-date-picker v-model="newExpireDate" type="date" style="width: 100%" />
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="saveEdit">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
  .service-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }
</style>
