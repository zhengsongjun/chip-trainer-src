<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import WrongBookColumnDialog from './WrongBookColumnDialog.vue'
  import { useUserStore } from '@/stores/user'
  import { useWrongPracticeStore } from '@/stores/wrongPractice'
  import { useWrongBook, type WrongBookRow } from '../../composables/useWrongBookData'

  // ⭐ 新增：专用服务函数（下面我会给你实现）
  import { fetchWrongPracticeItems } from '@/services/fetchWrongPracticeItems'

  const router = useRouter()
  const wrongPracticeStore = useWrongPracticeStore()

  /* ================= 用户 ================= */
  const userStore = useUserStore()
  const userId = computed(() => userStore.profile?.uid ?? '')

  const SUBMODES = {
    chip: [
      { key: 'cash', label: '现金局' },
      { key: 'tournament', label: '锦标赛' },
    ],
    'board-analysis': [
      { key: 'holdem', label: "Hold'em" },
      { key: 'omaha', label: 'Omaha' },
      { key: 'bigo', label: '7 Card Stud' },
      { key: '7stud', label: '7 Card Stud' },
      { key: 'razz', label: 'Razz' },
      { key: 'badugi', label: 'Badugi' },
    ],
  } as const

  const selectedSubModes = ref<Record<string, boolean>>({})

  /* ================= 分页 ================= */
  const page = ref(1)
  const pageSize = ref(20)
  const cursorStack = ref<any[]>([])
  const lastCursor = ref<any>(null)

  /* ================= 数据 ================= */
  const rows = ref<WrongBookRow[]>([])

  const { loading, fetchWrongBookRows } = useWrongBook()

  /* ================= UI ================= */
  const dialogVisible = ref(false)
  const selectedRows = ref<WrongBookRow[]>([])

  /* ================= 拉数据 ================= */
  watch(
    userId,
    async (uid) => {
      if (!uid) return

      const res = await fetchWrongBookRows({
        userId: uid,
        pageSize: pageSize.value,
        cursor: null,
      })

      rows.value = res.rows
      lastCursor.value = res.lastDoc
    },
    { immediate: true }
  )

  /* ================= 表格 ================= */
  function onSelectionChange(r: WrongBookRow[]) {
    selectedRows.value = r
  }

  /* ================= 行为 ================= */
  function applyPractice() {
    if (selectedRows.value.length === 0) {
      ElMessage.error('请选择日期')
      return
    }
    dialogVisible.value = true
  }

  // ⭐ 核心改动：确认时再查一次明细

  async function onConfirmPractice(subModes: Record<string, boolean>) {
    if (!userId.value) return

    const dates = selectedRows.value.map((r) => r.date)

    try {
      const practiceItems = await fetchWrongPracticeItems({
        userId: userId.value,
        dates,
        subModes,
      })

      if (practiceItems.length === 0) {
        ElMessage.warning('所选条件下没有可练习的错题')
        return
      }

      // 写入 pinia
      wrongPracticeStore.setPracticeItems(practiceItems)

      // 跳转练习页
      router.push('/wrong-practice')
    } catch (e) {
      console.error('[wrong-practice] fetch failed', e)
      ElMessage.error('加载错题失败，请稍后重试')
    }
  }

  /* ================= 分页变化 ================= */
  watch(pageSize, async () => {
    if (!userId.value) return

    page.value = 1
    cursorStack.value = []
    lastCursor.value = null

    const res = await fetchWrongBookRows({
      userId: userId.value,
      pageSize: pageSize.value,
      cursor: null,
    })

    rows.value = res.rows
    lastCursor.value = res.lastDoc
  })

  watch(page, async (newPage, oldPage) => {
    if (!userId.value) return
    if (newPage === oldPage) return

    if (newPage > oldPage) {
      cursorStack.value.push(lastCursor.value)
    } else {
      cursorStack.value.pop()
    }

    const cursor =
      cursorStack.value.length > 0 ? cursorStack.value[cursorStack.value.length - 1] : null

    const res = await fetchWrongBookRows({
      userId: userId.value,
      pageSize: pageSize.value,
      cursor,
    })

    rows.value = res.rows
    lastCursor.value = res.lastDoc
  })
</script>

<template>
  <WrongBookColumnDialog
    v-model="dialogVisible"
    v-model:value="selectedSubModes"
    :tree="SUBMODES"
    @confirm="onConfirmPractice"
  />
  <div class="header-opeartor">
    <el-button type="primary" @click="applyPractice">去练习</el-button>
  </div>
  <el-table
    :data="rows"
    stripe
    row-key="date"
    v-loading="loading"
    @selection-change="onSelectionChange"
  >
    <el-table-column type="selection" width="48" />
    <el-table-column prop="date" label="日期" />

    <el-table-column label="筹码错题">
      <template #default="{ row }">
        <el-tooltip placement="top" effect="light" :show-after="200">
          <template #content>
            <div class="tt">
              <div class="tt-title">筹码错题分布</div>

              <div v-if="row.chipSubModes.cash > 0" class="tt-row">
                <span>现金局</span>
                <span>{{ row.chipSubModes.cash }}</span>
              </div>

              <div v-if="row.chipSubModes.tournament > 0" class="tt-row">
                <span>锦标赛</span>
                <span>{{ row.chipSubModes.tournament }}</span>
              </div>
            </div>
          </template>

          <span class="summary-num">
            {{ row.chipCount }}
          </span>
        </el-tooltip>
      </template>
    </el-table-column>

    <el-table-column label="牌面分析错题">
      <template #default="{ row }">
        <el-tooltip placement="top" effect="light" :show-after="200">
          <template #content>
            <div class="tt">
              <div class="tt-title">牌面分析错题分布</div>

              <template v-if="Object.values(row.boardAnalysisSubModes).some((v) => v > 0)">
                <div
                  v-for="[mode, count] in Object.entries(row.boardAnalysisSubModes).filter(
                    ([_, count]) => count > 0
                  )"
                  :key="mode"
                  class="tt-row"
                >
                  <span>{{ mode }}</span>
                  <span>{{ count }}</span>
                </div>
              </template>

              <div v-else class="tt-row muted">暂无细分数据</div>
            </div>
          </template>

          <span class="summary-num">
            {{ row.boardAnalysisCount }}
          </span>
        </el-tooltip>
      </template>
    </el-table-column>
  </el-table>
  <div class="table-footer">
    <div class="footer-left">
      <span class="muted">每页</span>
      <el-select v-model="pageSize" class="page-size">
        <el-option :value="10" label="10" />
        <el-option :value="20" label="20" />
        <el-option :value="50" label="50" />
      </el-select>
      <span class="muted">条</span>
    </div>

    <el-pagination
      v-model:current-page="page"
      :page-size="pageSize"
      layout="prev, pager, next"
      background
    />
  </div>
</template>

<style>
  .header-opeartor {
    display: flex;
    justify-content: right;
  }
  .summary-num {
    font-weight: 600;
    cursor: pointer;
  }

  .tt {
    min-width: 160px;
    font-size: 13px;
  }

  .tt-title {
    font-weight: 600;
    margin-bottom: 6px;
  }

  .tt-row {
    display: flex;
    justify-content: space-between;
    line-height: 1.6;
  }

  .table-footer {
    width: 100%;
    margin-top: 12px;
  }

  .footer-left {
    display: flex;
    align-items: center;
    justify-content: right;
  }

  .page-size {
    width: 90px;
  }

  .muted {
    color: #909399;
  }
  .summary-num {
    font-weight: 600;
    cursor: pointer;
  }

  .tt {
    min-width: 160px;
    font-size: 13px;
  }

  .tt-title {
    font-weight: 600;
    margin-bottom: 6px;
  }

  .tt-row {
    display: flex;
    justify-content: space-between;
    line-height: 1.6;
  }
</style>
