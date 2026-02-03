<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue'
  import { ElMessage } from 'element-plus'
  import { useRouter } from 'vue-router'
  import VerticalProgress from './components/VerticalProgress.vue'
  import ChipBoardPractice from './components/ChipBoardPractice.vue'
  import { useWrongPracticeStore } from '@/stores/wrongPractice'
  import { writeWrongPracticeDaily } from '@/trainerCount/writers/writeWrongPracticeDaily'
  import { useUserStore } from '@/stores/user'
  import { isSameLevelMapIgnoreEmpty } from './isSameLevelMap'
  import PokerBoard from '../BoardAnalysis/components/PokerBoard.vue'
  const router = useRouter()
  const userStore = useUserStore()
  const userId = computed(() => userStore.profile?.uid ?? '')
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

  const boardAnalysisAnswer = ref<{ string: number }>({} as any)

  /* ================= 提交结果 ================= */
  function onSubmitAnswer(value: string | number) {
    console.log(currentItem.value.payload.correctValue)
    if (Number(value) === currentItem.value.payload.correctValue) {
      goNext()
    } else {
      ElMessage.error('答错了')
    }
  }

  function onBoardChange(value: any) {
    console.log(value)
    boardAnalysisAnswer.value = value
  }

  function boardAnalysisSubmit() {
    if (
      isSameLevelMapIgnoreEmpty(
        boardAnalysisAnswer.value as any,
        currentItem?.value?.payload?.correctValue
      )
    ) {
      goNext()
      boardAnalysisAnswer.value = {} as any
    } else {
      ElMessage.error('答错了')
      console.log(boardAnalysisAnswer.value)
    }
  }

  async function goNext() {
    if (currentIndex.value < total.value - 1) {
      currentIndex.value += 1
    } else {
      ElMessage.success('练习完成 🎉')

      const items = wrongPracticeStore.items

      const byMode: Record<string, number> = {}
      const bySubMode: Record<string, number> = {}

      for (const item of items) {
        byMode[item.mode] = (byMode[item.mode] || 0) + 1
        bySubMode[item.subMode] = (bySubMode[item.subMode] || 0) + 1
      }

      await writeWrongPracticeDaily({
        userId: userId.value,
        date: new Date().toISOString().slice(0, 10),
        byMode,
        bySubMode,
        total: items.length,
      })

      wrongPracticeStore.clear()
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

        <template v-if="currentItem?.mode === 'board-analysis'">
          <div class="borad-stage">
            <PokerBoard
              :active-seats="currentItem.payload.activeSeats"
              :player-hands="currentItem.payload.playerHands"
              :player-stud-cards="currentItem.payload.playerStudCards"
              :board-cards="currentItem.payload.boardCards"
              :game-mode="currentItem.payload.gameMode"
              :game-type="currentItem.payload.gameType"
              @change="onBoardChange"
            />
            <button @click="boardAnalysisSubmit">提交</button>
          </div>
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
    width: 1400px;
    margin: 0 auto;
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

  .borad-stage {
    width: 100%;
  }
</style>
