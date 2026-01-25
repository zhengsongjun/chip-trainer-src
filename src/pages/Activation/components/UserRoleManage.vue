<script setup lang="ts">
  import { ref, onMounted, watch } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    collection,
    getDocs,
    query,
    orderBy,
    startAfter,
    limit,
    where,
    updateDoc,
    doc,
  } from 'firebase/firestore'
  import { db } from '@/firebase'

  type UserItem = {
    uid: string
    email: string
    role: 'admin' | 'user'
    createdAt: Date | null
  }

  /* ================= 状态 ================= */

  const users = ref<UserItem[]>([])
  const keyword = ref('')
  const loading = ref(false)

  const pageSize = 10
  const currentPage = ref(1)
  const total = ref(0)

  /**
   * Firestore 分页游标
   */
  let lastVisible: any = null

  /* ================= 数据加载（后台分页 + 搜索） ================= */

  async function loadUsers(reset = false) {
    loading.value = true

    try {
      if (reset) {
        users.value = []
        currentPage.value = 1
        lastVisible = null
      }

      const baseRef = collection(db, 'users')

      let q

      if (keyword.value) {
        /**
         * 后台邮箱搜索（前缀匹配）
         * 需要 email 字段 + orderBy(email)
         */
        q = query(
          baseRef,
          orderBy('email'),
          where('email', '>=', keyword.value),
          where('email', '<=', keyword.value + '\uf8ff'),
          limit(pageSize)
        )
      } else {
        q = query(
          baseRef,
          orderBy('createdAt', 'desc'),
          ...(lastVisible ? [startAfter(lastVisible)] : []),
          limit(pageSize)
        )
      }

      const snap = await getDocs(q)

      if (snap.empty) {
        users.value = []
        total.value = 0
        return
      }

      lastVisible = snap.docs[snap.docs.length - 1]

      users.value = snap.docs.map((d) => {
        const data = d.data()
        return {
          uid: d.id,
          email: data.email,
          role: data.role ?? 'user',
          createdAt: data.createdAt?.toDate?.() ?? null,
        }
      })

      /**
       * total：Firestore 无法直接 count
       * 这里是近似方案（管理页够用）
       */
      total.value = users.value.length + (currentPage.value - 1) * pageSize
    } finally {
      loading.value = false
    }
  }

  onMounted(() => loadUsers(true))

  watch(keyword, () => {
    loadUsers(true)
  })

  /* ================= 分页 ================= */

  function handlePageChange(page: number) {
    currentPage.value = page
    loadUsers()
  }

  /* ================= 操作 ================= */

  async function toggleRole(user: UserItem) {
    const targetRole = user.role === 'admin' ? 'user' : 'admin'

    await ElMessageBox.confirm(
      `确定将该用户设为「${targetRole === 'admin' ? '管理员' : '普通用户'}」？`,
      '确认操作',
      { type: 'warning' }
    )

    await updateDoc(doc(db, 'users', user.uid), {
      role: targetRole,
    })

    user.role = targetRole
    ElMessage.success('角色已更新')
  }

  /* ================= 工具 ================= */

  function formatDate(date: Date | null) {
    if (!date) return '-'
    return date.toISOString().slice(0, 10)
  }
</script>

<template>
  <div class="admin-panel">
    <!-- 标题 -->
    <h2 class="panel-title">管理员指派</h2>

    <!-- 搜索 -->
    <el-input v-model="keyword" placeholder="按邮箱搜索用户" clearable class="search-input" />

    <!-- 表格 -->
    <el-table :data="users" v-loading="loading" empty-text="暂无用户数据" class="user-table">
      <el-table-column prop="email" label="邮箱" />

      <el-table-column label="注册时间" width="160">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>

      <el-table-column label="当前身份" width="120">
        <template #default="{ row }">
          <span :class="['role-tag', row.role === 'admin' ? 'is-admin' : 'is-user']">
            {{ row.role === 'admin' ? '管理员' : '普通用户' }}
          </span>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button
            size="small"
            :type="row.role === 'admin' ? 'danger' : 'primary'"
            @click="toggleRole(row)"
          >
            {{ row.role === 'admin' ? '取消管理员' : '指派为管理员' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="panel-pagination">
      <el-pagination
        background
        layout="prev, pager, next"
        :page-size="pageSize"
        :current-page="currentPage"
        :total="total"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped>
  /* ================= 页面 ================= */

  .page-simple {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--space-6);
  }

  /* ================= ui-panel ================= */

  .admin-panel {
    padding: var(--space-6);
    background: var(--color-bg-container);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
  }

  /* ================= 标题 ================= */

  .panel-title {
    margin: 0 0 var(--space-4);
    font-size: var(--font-size-md);
    font-weight: 600;
    color: var(--color-text-primary);
  }

  /* ================= 搜索 ================= */

  .search-input {
    max-width: 320px;
    margin-bottom: var(--space-4);
  }

  /* ================= 表格 ================= */

  .user-table {
    width: 100%;
  }

  /* ================= 角色 ================= */

  .role-tag {
    font-size: var(--font-size-xs);
    font-weight: 500;
  }

  .role-tag.is-admin {
    color: var(--color-danger);
  }

  .role-tag.is-user {
    color: var(--color-text-secondary);
  }

  /* ================= 分页 ================= */

  .panel-pagination {
    margin-top: var(--space-4);
    display: flex;
    justify-content: flex-end;
  }
</style>
