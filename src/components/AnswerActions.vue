<script setup lang="ts">
import { Check, Refresh, View } from '@element-plus/icons-vue'

defineProps<{
  feedback: 'idle' | 'correct' | 'wrong'
  showAnswer: boolean
  correctValue: number
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
    <div class="actions">
      <div class="actions">
        <el-button
          type="primary"
          :icon="Check"
          @click="emit('submit')"
        >
          提交
        </el-button>

        <el-button
          type="warning"
          :icon="Refresh"
          @click="emit('next')"
        >
          换一题
        </el-button>

        <el-button
          type="info"
          plain
          :icon="View"
          @click="emit('toggleAnswer')"
        >
          {{ showAnswer ? '隐藏答案' : '显示答案' }}
        </el-button>
      </div>
    </div>

    <!-- 反馈区 -->
    <div class="feedback">
      <el-alert
        v-if="feedback === 'correct'"
        type="success"
        show-icon
        :closable="false"
        title="回答正确！"
      />

      <el-alert
        v-else-if="feedback === 'wrong'"
        type="error"
        show-icon
        :closable="false"
        title="回答不正确，再试试～"
      />
    </div>

    <!-- 答案区 -->
    <div v-if="showAnswer" class="answer">
      <el-alert
        type="info"
        show-icon
        :closable="false"
      >
        <template #default>
          正确答案：
          <strong class="answer-value">{{ correctValue }}</strong>
        </template>
      </el-alert>
    </div>
  </div>
</template>

<style scoped>
.answer-actions {
  display: grid;
  gap: 16px; /* 整体垂直节奏 */
}

/* 操作区和反馈区稍微拉开 */
.actions {
  margin-bottom: 4px;
}

.actions {
  display: flex;
  gap: 12px; /* 👈 控制按钮左右间距，推荐 12px */
}

/* 反馈信息不要贴太紧 */
.feedback {
  margin-top: 4px;
}

/* 答案区域单独呼吸感 */
.answer {
  margin-top: 8px;
}

.answer-value {
  font-size: 16px;
  font-weight: 600;
  margin-left: 4px;
}
</style>
