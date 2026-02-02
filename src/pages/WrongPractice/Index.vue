<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue'
  import { ElMessage } from 'element-plus'
  import { useRouter } from 'vue-router'

  import VerticalProgress from './components/VerticalProgress.vue'
  import ChipBoardPractice from './components/ChipBoardPractice.vue'

  import { useWrongPracticeStore } from '@/stores/wrongPractice'

  /* ================= router ================= */
  const router = useRouter()

  /* ================= store ================= */
  const wrongPracticeStore = useWrongPracticeStore()

  /**
   * 页面进入时：从 localStorage 恢复
   */
  onMounted(() => {
    wrongPracticeStore.restoreFromStorage()

    if (wrongPracticeStore.items.length === 0) {
      ElMessage.warning('没有可练习的错题，已返回')
      router.replace('/profile') // 或你错题表格页
    }
  })

  /* ================= 练习状态 ================= */
  const currentIndex = ref(0)

  const total = computed(() => wrongPracticeStore.items.length)
  const current = computed(() => currentIndex.value + 1)

  const currentItem = computed(() => {
    return wrongPracticeStore.items[currentIndex.value] || null
  })

  /* ================= 提交结果 ================= */
  function onSubmitAnswer(value: string | number) {
    console.log(currentItem.value.payload.correctValue)
    if (Number(value) === currentItem.value.payload.correctValue) {
      goNext()
    } else {
      ElMessage.error('答错了')
    }
  }

  function goNext() {
    if (currentIndex.value < total.value - 1) {
      currentIndex.value += 1
    } else {
      ElMessage.success('练习完成 🎉')

      // 可选：清空练习
      wrongPracticeStore.clear()

      // 返回个人中心 / 错题本
      router.replace('/profile')
    }
  }
</script>

<template>
  <div class="practice-page">
    {{ currentItem?.payload?.correctValue }}
    <div class="practice-body">
      <!-- 中间练习区 -->
      <main class="practice-stage">
        <template v-if="currentItem?.mode === 'chip'">
          <ChipBoardPractice :groups="currentItem?.payload?.chipGroups" @confirm="onSubmitAnswer" />
        </template>

        <template v-else>
          <div class="stage-placeholder">暂无题目</div>
        </template>
      </main>
    </div>

    <!-- 右侧纵向进度条 -->
    <VerticalProgress :current="current" :total="total" />
  </div>
</template>

<style scoped>
  /* 整页 */
  .practice-page {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #f6f7fb;
  }

  /* 主体 */
  .practice-body {
    flex: 1;
    display: flex;
    padding: 20px;
    gap: 20px;
  }

  /* 中间练习区 */
  .practice-stage {
    flex: 1;
    background: #ffffff;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
  }

  .stage-placeholder {
    color: #909399;
    font-size: 14px;
  }
</style>
