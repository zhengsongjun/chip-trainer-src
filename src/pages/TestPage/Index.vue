<script setup lang="ts">
  import {
    collection,
    doc,
    setDoc,
    addDoc,
    getDocs,
    deleteDoc,
    query,
    where,
    Timestamp,
  } from 'firebase/firestore'
  import { db } from '@/firebase'
  import { writeWrongDaily } from '@/trainerCount/writers/writeWrongDaily'

  const mergeData = async () => {
    await writeWrongDaily({
      userId: 'test_user',
      date: '2026-02-03',
      delta: {
        totalWrong: 2,
        byMode: { chip: 2 },
        bySubMode: { cash: 1, tournament: 1 },
        sessionIds: ['test_session'],
        updatedAt: Date.now(),
      },
    })
  }
</script>

<template>
  <div style="padding: 24px; display: flex; gap: 16px">
    <el-button type="primary" @click="mergeData">add or merge </el-button>
  </div>
</template>
