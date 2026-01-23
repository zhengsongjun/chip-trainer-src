<script setup lang="ts">
  import { ref, onMounted } from 'vue'
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
  } from 'firebase/firestore'

  /* ================= 配置项 ================= */
  const durations = [
    { label: '3个月', value: 3 },
    { label: '6个月', value: 6 },
    { label: '12个月', value: 12 },
  ]

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
  async function fetchActivationCodes() {
    loading.value = true
    activationCodes.value = []

    const q = query(collection(db, 'activation_codes'), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)

    snap.forEach((d) => {
      activationCodes.value.push({
        code: d.id,
        ...d.data(),
      })
    })

    loading.value = false
  }

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

  onMounted(fetchActivationCodes)
</script>

<template>
  <el-card>
    <template #header>
      <span>激活码管理</span>
    </template>

    <!-- 表单 -->
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

    <!-- 表格 -->
    <el-table :data="activationCodes" v-loading="loading" style="margin-top: 16px">
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
</template>
