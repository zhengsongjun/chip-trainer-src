<script setup lang="ts">
  import { useTrainingSession } from '@/trainerCount/hooks/useTrainingSession'
  import { ref } from 'vue'

  /**
   * Payload 类型：题目结构
   */
  type QuestionPayload = {
    a: number
    b: number
    correctAnswer: number
  }

  const { startSession, answerQuestion, finishSession, session } = useTrainingSession<
    QuestionPayload,
    'math',
    'add'
  >()

  const currentIndex = ref(1)
  const inputAnswer = ref<number | null>(null)
  const finished = ref(false)

  function start() {
    startSession({
      sessionId: crypto.randomUUID(),
      userId: 'test-user',
      mode: 'math',
      subMode: 'add',
    })

    currentIndex.value = 1
    inputAnswer.value = null
    finished.value = false

    console.log('🟢 session started')
  }

  function submitAnswer() {
    if (!session.value) return
    if (inputAnswer.value === null) return

    const a = 1
    const b = currentIndex.value
    const correct = a + b

    const payload: QuestionPayload = {
      a,
      b,
      correctAnswer: correct,
    }

    const isCorrect = inputAnswer.value === correct

    answerQuestion({
      isCorrect,
      payload,
      userAnswer: inputAnswer.value,
      answerTimeMs: Math.floor(Math.random() * 1000) + 300,
      mode: 'math',
      subMode: 'add',
    })

    console.log(`第 ${currentIndex.value} 题答完`, { input: inputAnswer.value, correct })

    inputAnswer.value = null
    currentIndex.value++

    if (currentIndex.value > 10) {
      const result = finishSession()
      finished.value = true

      console.log('🟣 session finished（10 题）')
      console.log(result)
    }
  }
</script>

<template>
  <div style="padding: 24px">
    <h2>TrainingCount Test Page</h2>

    <button @click="start">开始训练</button>

    <div v-if="session && !finished" style="margin-top: 16px">
      <p>第 {{ currentIndex }} 题： 1 + {{ currentIndex }} =</p>

      <input type="number" v-model.number="inputAnswer" placeholder="输入你的答案" />

      <button @click="submitAnswer">提交</button>
    </div>

    <div v-if="finished" style="margin-top: 16px">
      <p>训练结束，请查看 console 输出</p>
    </div>
  </div>
</template>
