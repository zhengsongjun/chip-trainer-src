<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { auth, db } from '@/firebase'
  import {
    collection,
    doc,
    setDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    query,
    orderBy,
  } from 'firebase/firestore'

  /* ================= Tabs ================= */
  const activeTab = ref<'codes' | 'admin'>('codes')

  /* ================= 基础配置 ================= */
  const durations = [
    { label: '3个月', value: 3 },
    { label: '6个月', value: 6 },
    { label: '12个月', value: 12 },
  ]

  const services = [
    { label: '筹码反应训练', value: 'chipTrainer' },
    { label: '牌面训练', value: 'faceTrainer' },
  ]

  const SERVICE_LABEL_MAP: Record<string, string> = {
    chipTrainer: '筹码反应训练',
    faceTrainer: '牌面训练',
  }

  /* =====================================================
   Tab 1：激活码管理
===================================================== */
  const selectedDuration = ref<number | null>(null)
  const selectedServices = ref<string[]>([])
  const activationCodes = ref<any[]>([])
  const loadingCodes = ref(false)

  function generateCode() {
    return `ACT-${Math.random().toString(36).slice(2, 10).toUpperCase()}`
  }

  function calculatePrice() {
    const base = 100
    return Number(
      (
        base * (selectedDuration.value || 1) * selectedServices.value.length +
        Math.random() * 50
      ).toFixed(2)
    )
  }

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code)
    ElMessage.success('激活码已复制到剪贴板')
  }

  async function fetchActivationCodes() {
    loadingCodes.value = true
    activationCodes.value = []

    const q = query(collection(db, 'activation_codes'), orderBy('createdAt', 'desc'))

    const snap = await getDocs(q)
    snap.forEach((d) => {
      activationCodes.value.push({
        code: d.id,
        ...d.data(),
      })
    })

    loadingCodes.value = false
  }

  async function createActivationCode() {
    if (!selectedDuration.value || !selectedServices.value.length) {
      ElMessage.warning('请选择时长和服务')
      return
    }

    const code = generateCode()

    await setDoc(doc(db, 'activation_codes', code), {
      duration: selectedDuration.value,
      services: selectedServices.value,
      price: calculatePrice(),
      isActivated: false,
      createdAt: serverTimestamp(),
      createdBy: auth.currentUser?.uid || 'unknown',
    })

    ElMessage.success('激活码生成成功')
    selectedDuration.value = null
    selectedServices.value = []

    fetchActivationCodes()
  }

  async function removeCode(row: any) {
    if (row.isActivated) {
      ElMessage.warning('已激活的激活码不能删除')
      return
    }

    await ElMessageBox.confirm(`确认删除激活码 ${row.code}？`, '确认删除', {
      type: 'warning',
    })

    await deleteDoc(doc(db, 'activation_codes', row.code))
    fetchActivationCodes()
  }

  /* =====================================================
   Tab 2：管理员调整
===================================================== */
  const searchEmail = ref('')
  const currentPage = ref(1)
  const pageSize = ref(10)

  type ServiceItem = {
    key: string
    label: string
    expiresAt: string
  }

  type AdminUserRow = {
    userId: string
    email: string
    services: ServiceItem[]
  }

  const adminUsers = ref<AdminUserRow[]>([])
  const loadingAdmin = ref(false)

  /* ---------- 编辑弹窗 ---------- */
  const editDialogVisible = ref(false)
  const editingUserId = ref('')
  const editingServiceKey = ref('')
  const newExpireDate = ref('')

  async function fetchAdminUsers() {
    loadingAdmin.value = true
    adminUsers.value = []

    // users 表：uid -> email
    const userSnap = await getDocs(collection(db, 'users'))
    const emailMap: Record<string, string> = {}
    userSnap.forEach((d) => {
      emailMap[d.id] = d.data().email
    })

    // user_activation_service
    const serviceSnap = await getDocs(collection(db, 'user_activation_service'))
    serviceSnap.forEach((d) => {
      const services = d.data().services || {}
      const list: ServiceItem[] = []

      Object.keys(services).forEach((key) => {
        list.push({
          key,
          label: SERVICE_LABEL_MAP[key] || key,
          expiresAt: services[key].expiresAt.toDate().toISOString().slice(0, 10),
        })
      })

      adminUsers.value.push({
        userId: d.id,
        email: emailMap[d.id] || '未知邮箱',
        services: list,
      })
    })

    loadingAdmin.value = false
  }

  const filteredUsers = computed(() => {
    if (!searchEmail.value) return adminUsers.value
    return adminUsers.value.filter((u) =>
      u.email.toLowerCase().includes(searchEmail.value.toLowerCase())
    )
  })

  const pagedUsers = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    return filteredUsers.value.slice(start, start + pageSize.value)
  })

  function openEdit(userId: string, serviceKey: string, expiresAt: string) {
    editingUserId.value = userId
    editingServiceKey.value = serviceKey
    newExpireDate.value = expiresAt
    editDialogVisible.value = true
  }

  async function saveEdit() {
    await updateDoc(doc(db, 'user_activation_service', editingUserId.value), {
      [`services.${editingServiceKey.value}.expiresAt`]: new Date(newExpireDate.value),
      updatedAt: serverTimestamp(),
    })

    ElMessage.success('服务到期时间已更新')
    editDialogVisible.value = false
    fetchAdminUsers()
  }

  /* ================= 初始化 ================= */
  onMounted(() => {
    fetchActivationCodes()
    fetchAdminUsers()
  })
</script>

<template>
  <el-tabs v-model="activeTab">
    <!-- ================= 激活码管理 ================= -->
    <el-tab-pane label="激活码管理" name="codes">
      <el-card>
        <el-radio-group v-model="selectedDuration" style="margin-bottom: 12px">
          <el-radio v-for="item in durations" :key="item.value" :label="item.value">
            {{ item.label }}
          </el-radio>
        </el-radio-group>

        <el-checkbox-group v-model="selectedServices" style="margin-bottom: 12px">
          <el-checkbox v-for="item in services" :key="item.value" :label="item.value">
            {{ item.label }}
          </el-checkbox>
        </el-checkbox-group>

        <el-button type="primary" @click="createActivationCode"> 生成激活码 </el-button>

        <el-table :data="activationCodes" v-loading="loadingCodes" style="margin-top: 16px">
          <el-table-column prop="code" label="激活码" width="220" />
          <el-table-column prop="duration" label="时长（月）" width="100" />
          <el-table-column label="服务">
            <template #default="{ row }">
              {{ row.services.join(', ') }}
            </template>
          </el-table-column>
          <el-table-column prop="price" label="价格（USD）" width="120" />
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <el-tag v-if="row.isActivated" type="success">已激活</el-tag>
              <el-tag v-else type="info">未激活</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220">
            <template #default="{ row }">
              <el-tag v-if="row.isActivated" type="success">已激活</el-tag>
              <template v-else>
                <el-button size="small" @click="copyCode(row.code)"> 发放（复制） </el-button>
                <el-button size="small" type="danger" @click="removeCode(row)"> 删除 </el-button>
              </template>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </el-tab-pane>

    <!-- ================= 管理员调整 ================= -->
    <el-tab-pane label="管理员调整" name="admin">
      <el-card>
        <el-input
          v-model="searchEmail"
          placeholder="搜索用户邮箱"
          clearable
          style="width: 300px; margin-bottom: 16px"
        />

        <el-table :data="pagedUsers" v-loading="loadingAdmin">
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
    </el-tab-pane>
  </el-tabs>

  <!-- 编辑弹窗 -->
  <el-dialog v-model="editDialogVisible" title="调整服务到期时间" width="400px">
    <el-date-picker v-model="newExpireDate" type="date" style="width: 100%" />

    <template #footer>
      <el-button @click="editDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="saveEdit">保存</el-button>
    </template>
  </el-dialog>
  <el-button @click="console.log(pagedUsers)">console 打印当前页</el-button>
</template>

<style scoped>
  .service-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }
</style>
