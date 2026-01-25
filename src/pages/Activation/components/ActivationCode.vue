<script setup lang="ts">
  import { ref, onMounted, watch } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { auth, db } from '@/firebase'
  import {
    collection,
    doc,
    setDoc,
    getDocs,
    deleteDoc,
    serverTimestamp,
    query,
    orderBy,
    where,
    limit,
    startAfter,
  } from 'firebase/firestore'
  /* ================= 批量选择 ================= */

  const selectedRows = ref<any[]>([])

  /**
   * 选中行变化
   */
  function handleSelectionChange(rows: any[]) {
    selectedRows.value = rows
  }

  /**
   * 是否允许被选中（已激活的不允许）
   */
  function rowSelectable(row: any) {
    return !row.isActivated
  }
  const batchDialogVisible = ref(false)
  const batchCount = ref<number | null>(null)
  /* ================= 配置项 ================= */
  const durations = [
    { label: '3个月', value: 3 },
    { label: '6个月', value: 6 },
    { label: '12个月', value: 12 },
  ]

  const pageSize = 10
  const currentPage = ref(1)
  const lastVisible = ref<any>(null)
  const hasMore = ref(true)
  const statusFilter = ref<'all' | 'activated' | 'inactive'>('all')
  function openBatchDialog() {
    if (!selectedDuration.value) {
      ElMessage.warning('请选择时长')
      return
    }
    if (!selectedServices.value.length) {
      ElMessage.warning('请选择服务')
      return
    }

    batchDialogVisible.value = true
  }

  const services = [
    { label: '筹码反应训练', value: 'chipTrainer' },
    { label: '牌面分析', value: 'boardAnalysis' },
  ]

  /* ================= 表单状态 ================= */
  const selectedDuration = ref<number | null>(null)
  const selectedServices = ref<string[]>([])

  /* ================= 激活码列表 ================= */
  const activationCodes = ref<any[]>([])
  const loading = ref(false)

  /* ================= 工具函数 ================= */
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

  /* ================= 读取激活码 ================= */
  async function fetchActivationCodes(reset = false) {
    if (reset) {
      activationCodes.value = []
      currentPage.value = 1
      lastVisible.value = null
      hasMore.value = true
    }

    if (!hasMore.value) return

    loading.value = true

    try {
      const baseRef = collection(db, 'activation_codes')
      const constraints: any[] = []

      // 状态筛选
      if (statusFilter.value === 'activated') {
        constraints.push(where('isActivated', '==', true))
      } else if (statusFilter.value === 'inactive') {
        constraints.push(where('isActivated', '==', false))
      }

      constraints.push(orderBy('createdAt', 'desc'))

      if (lastVisible.value) {
        constraints.push(startAfter(lastVisible.value))
      }

      constraints.push(limit(pageSize))

      const q = query(baseRef, ...constraints)
      const snap = await getDocs(q)

      if (snap.empty) {
        hasMore.value = false
        return
      }

      lastVisible.value = snap.docs[snap.docs.length - 1]

      snap.forEach((d) => {
        activationCodes.value.push({
          code: d.id,
          ...d.data(),
        })
      })
    } finally {
      loading.value = false
    }
  }
  watch(statusFilter, () => {
    fetchActivationCodes(true)
  })

  /* ================= 创建激活码 ================= */
  async function createActivationCode() {
    if (!selectedDuration.value) {
      ElMessage.warning('请选择时长')
      return
    }
    if (!selectedServices.value.length) {
      ElMessage.warning('请选择服务')
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

  /* ================= 操作 ================= */
  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code)
    ElMessage.success('激活码已复制到剪贴板')
  }

  async function removeCode(row: any) {
    if (row.isActivated) {
      ElMessage.warning('已激活的激活码不能删除')
      return
    }

    await ElMessageBox.confirm(`确认删除激活码 ${row.code}？`, '确认删除', { type: 'warning' })

    await deleteDoc(doc(db, 'activation_codes', row.code))
    ElMessage.success('已删除')
    fetchActivationCodes()
  }

  /**
   * 批量生成激活码
   */
  async function createBatchActivationCodes() {
    if (!selectedDuration.value) {
      ElMessage.warning('请选择时长')
      return
    }
    if (!selectedServices.value.length) {
      ElMessage.warning('请选择服务')
      return
    }
    if (!batchCount.value || batchCount.value <= 0) {
      ElMessage.warning('请输入有效的生成数量')
      return
    }

    loading.value = true

    try {
      const tasks: Promise<void>[] = []

      for (let i = 0; i < batchCount.value; i++) {
        const code = generateCode()
        tasks.push(
          setDoc(doc(db, 'activation_codes', code), {
            duration: selectedDuration.value,
            services: selectedServices.value,
            price: calculatePrice(),
            isActivated: false,
            createdAt: serverTimestamp(),
            createdBy: auth.currentUser?.uid || 'unknown',
          })
        )
      }

      await Promise.all(tasks)

      ElMessage.success(`成功生成 ${batchCount.value} 个激活码`)

      batchDialogVisible.value = false
      batchCount.value = null

      fetchActivationCodes()
    } finally {
      loading.value = false
    }
  }

  async function batchRemoveCodes() {
    if (!selectedRows.value.length) {
      ElMessage.warning('请先选择要删除的激活码')
      return
    }

    await ElMessageBox.confirm(
      `确认删除选中的 ${selectedRows.value.length} 个激活码？`,
      '批量删除确认',
      { type: 'warning' }
    )

    loading.value = true

    try {
      const tasks = selectedRows.value.map((row) =>
        deleteDoc(doc(db, 'activation_codes', row.code))
      )

      await Promise.all(tasks)

      ElMessage.success('批量删除成功')

      selectedRows.value = []
      fetchActivationCodes(true)
    } finally {
      loading.value = false
    }
  }

  onMounted(() => fetchActivationCodes(true))
</script>

<template>
  <!-- 批量生成 Dialog（不动） -->
  <el-dialog v-model="batchDialogVisible" title="批量生成激活码" width="360px">
    <div class="batch-form">
      <el-input-number
        v-model="batchCount"
        :min="1"
        :max="100"
        controls-position="right"
        placeholder="生成数量"
        style="width: 100%"
      />
    </div>

    <template #footer>
      <el-button @click="batchDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="createBatchActivationCodes">确认生成</el-button>
    </template>
  </el-dialog>

  <el-card class="activation-card">
    <template #header>
      <span class="card-title">激活码管理</span>
    </template>

    <!-- ================= 生成区 ================= -->
    <div class="tool-section">
      <div class="tool-row">
        <el-radio-group v-model="selectedDuration">
          <el-radio v-for="item in durations" :key="item.value" :label="item.value">
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </div>

      <div class="tool-row">
        <el-checkbox-group v-model="selectedServices">
          <el-checkbox v-for="item in services" :key="item.value" :label="item.value">
            {{ item.label }}
          </el-checkbox>
        </el-checkbox-group>
      </div>

      <div class="tool-actions">
        <el-button type="primary" @click="createActivationCode"> 生成激活码 </el-button>
        <el-button @click="openBatchDialog"> 批量生成 </el-button>
      </div>
    </div>

    <!-- ================= 管理区 ================= -->
    <div class="tool-section tool-section--secondary">
      <div class="tool-actions">
        <el-select v-model="statusFilter" placeholder="激活状态" class="status-select">
          <el-option label="全部" value="all" />
          <el-option label="未激活" value="inactive" />
          <el-option label="已激活" value="activated" />
        </el-select>

        <el-button type="danger" plain :disabled="!selectedRows.length" @click="batchRemoveCodes">
          批量删除
        </el-button>
      </div>
    </div>

    <!-- ================= 表格 ================= -->
    <el-table
      :data="activationCodes"
      v-loading="loading"
      @selection-change="handleSelectionChange"
      class="activation-table"
    >
      <el-table-column type="selection" width="48" :selectable="rowSelectable" />
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
            <el-button size="small" @click="copyCode(row.code)">发放（复制）</el-button>
            <el-button size="small" type="danger" @click="removeCode(row)"> 删除 </el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <!-- ================= 分页 ================= -->
    <div class="table-footer">
      <el-button v-if="hasMore" :loading="loading" @click="fetchActivationCodes()">
        加载更多
      </el-button>
      <span v-else class="table-end">没有更多数据了</span>
    </div>
  </el-card>
</template>

<style scoped>
  .activation-card {
    font-size: var(--font-size-sm);
  }

  .card-title {
    font-weight: 600;
  }

  /* ================= 工具区 ================= */

  .tool-section {
    padding-bottom: 12px;
    margin-bottom: 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .tool-section--secondary {
    margin-top: 4px;
  }

  .tool-row {
    margin-bottom: 10px;
  }

  .tool-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  /* ================= 筛选 ================= */

  .status-select {
    width: 140px;
  }

  /* ================= 表格 ================= */

  .activation-table {
    margin-top: 12px;
  }

  /* ================= 表格底部 ================= */

  .table-footer {
    margin-top: 14px;
    text-align: center;
  }

  .table-end {
    font-size: 12px;
    color: #999;
  }
</style>
