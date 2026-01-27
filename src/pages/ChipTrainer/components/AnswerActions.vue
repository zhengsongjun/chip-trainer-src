<script setup lang="ts">
  import { Check, Refresh, View } from '@element-plus/icons-vue'
  import useChipTraining from '../../../i18n/customHook/chipTraining/useChipTraining'

  const {
    submit,
    next,
    showAnswer: tShowAnswer,
    hideAnswer,
    correct,
    wrong,
    correctAnswer,
  } = useChipTraining()
  defineProps<{
    feedback: 'idle' | 'correct' | 'wrong'
    showAnswer: boolean
    correctValue: number
    canSubmit: boolean
  }>()

  const emit = defineEmits<{
    (e: 'submit'): void
    (e: 'next'): void
    (e: 'toggleAnswer'): void
  }>()
</script>

<template>
  <div class="answer-actions">
    <!-- 操作区 -->
    <div class="actions-row">
      <el-button type="primary" :icon="Check" :disabled="!canSubmit" @click="emit('submit')">
        {{ submit }}
      </el-button>

      <el-button :icon="Refresh" @click="emit('next')">
        {{ next }}
      </el-button>

      <el-button plain :icon="View" @click="emit('toggleAnswer')">
        {{ showAnswer ? hideAnswer : tShowAnswer }}
      </el-button>
    </div>

    <!-- 反馈区 -->
    <div class="feedback">
      <el-alert
        v-if="feedback === 'correct'"
        type="success"
        show-icon
        :closable="false"
        :title="`${correct}！`"
      />

      <el-alert
        v-else-if="feedback === 'wrong'"
        type="error"
        show-icon
        :closable="false"
        :title="`${wrong}～`"
      />
    </div>

    <!-- 答案区 -->
    <div v-if="showAnswer" class="answer">
      <el-alert type="info" show-icon :closable="false">
        <template #default>
          {{ correctAnswer }}：
          <strong class="answer-value">{{ correctValue }}</strong>
        </template>
      </el-alert>
    </div>
  </div>
</template>

<style scoped>
  .answer-actions {
    display: grid;
    gap: var(--space-4);
    justify-items: center;
  }

  /* 操作按钮区 */
  .actions-row {
    display: flex;
    gap: var(--space-3);
  }

  /* 状态反馈 */
  .feedback {
    width: 100%;
  }

  /* 显示答案 */
  .answer {
    width: 100%;
  }

  /* 答案数值强调 */
  .answer-value {
    font-size: var(--font-size-md);
    font-weight: 600;
    margin-left: var(--space-1);
  }
</style>
