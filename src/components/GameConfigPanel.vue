<script setup lang="ts">
defineProps<{
  gameType: 'cash' | 'tournament'

  /* cash */
  enabledColors: string[]
  whiteRange: '1-20' | '20-60'

  /* tournament */
  tournamentColors: string[]
  blackRange: '1-19' | '20-60'
}>()

const emit = defineEmits<{
  /* common */
  (e: 'update:gameType', val: 'cash' | 'tournament'): void

  /* cash */
  (e: 'update:enabledColors', val: string[]): void
  (e: 'update:whiteRange', val: '1-20' | '20-60'): void

  /* tournament */
  (e: 'update:tournamentColors', val: string[]): void
  (e: 'update:blackRange', val: '1-19' | '20-60'): void
}>()
</script>

<template>
  <el-form label-position="top" class="filters">
    <!-- 游戏类型 -->
    <el-form-item label="游戏类型">
      <el-radio-group
        :model-value="gameType"
        @update:model-value="emit('update:gameType', $event)"
      >
        <el-radio label="cash">现金桌</el-radio>
        <el-radio label="tournament">锦标赛</el-radio>
      </el-radio-group>
    </el-form-item>

    <!-- ========== 现金赛配置 ========== -->
    <template v-if="gameType === 'cash'">
      <el-form-item label="筹码颜色">
        <el-checkbox-group
          :model-value="enabledColors"
          @update:model-value="emit('update:enabledColors', $event)"
        >
          <el-space size="large">
            <el-checkbox label="black">黑色（1–40）</el-checkbox>
            <el-checkbox label="green">绿色</el-checkbox>
            <el-checkbox label="red">红色</el-checkbox>
            <el-checkbox label="white">白色</el-checkbox>
          </el-space>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item
        v-if="enabledColors.includes('white')"
        label="白色筹码数量"
      >
        <el-radio-group
          :model-value="whiteRange"
          @update:model-value="emit('update:whiteRange', $event)"
        >
          <el-space size="large">
            <el-radio label="1-20">1–20 个白色</el-radio>
            <el-radio label="20-60">20–60 个白色</el-radio>
          </el-space>
        </el-radio-group>
      </el-form-item>
    </template>

    <!-- ========== 锦标赛配置 ========== -->
    <template v-else>
      <el-form-item label="筹码颜色">
        <el-checkbox-group
          :model-value="tournamentColors"
          @update:model-value="emit('update:tournamentColors', $event)"
        >
          <el-space size="large">
            <el-checkbox label="green25k">绿色（25k）</el-checkbox>
            <el-checkbox label="red5k">红色（5k）</el-checkbox>
            <el-checkbox label="yellow1k">金色（1k）</el-checkbox>
            <el-checkbox label="purple500">紫色（500）</el-checkbox>
            <el-checkbox label="black100">黑色（100）</el-checkbox>
          </el-space>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item
        v-if="tournamentColors.includes('black100')"
        label="黑色筹码数量"
      >
        <el-radio-group
          :model-value="blackRange"
          @update:model-value="emit('update:blackRange', $event)"
        >
          <el-space size="large">
            <el-radio label="1-19">1–19 个黑色</el-radio>
            <el-radio label="20-60">20–60 个黑色</el-radio>
          </el-space>
        </el-radio-group>
      </el-form-item>
    </template>
  </el-form>
</template>

<style scoped>
.filters {
  margin-bottom: 12px;
}
</style>
