<script setup lang="ts">
  import useChipTraining from '../../../i18n/customHook/chipTraining/useChipTraining'

  const {
    cashGame,
    tournamentGame,
    gameType: tGameType,
    chipColors,
    red,
    green,
    white,
    black,
    purple,
    gold,
  } = useChipTraining()

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
    <el-form-item :label="tGameType">
      <el-radio-group :model-value="gameType" @update:model-value="emit('update:gameType', $event)">
        <el-radio label="cash">{{ cashGame }}</el-radio>
        <el-radio label="tournament">{{ tournamentGame }}</el-radio>
      </el-radio-group>
    </el-form-item>

    <!-- ========== 现金赛配置 ========== -->
    <template v-if="gameType === 'cash'">
      <el-form-item :label="chipColors">
        <el-checkbox-group
          :model-value="enabledColors"
          @update:model-value="emit('update:enabledColors', $event)"
        >
          <el-space size="large">
            <el-checkbox label="black">{{ black }}</el-checkbox>
            <el-checkbox label="green">{{ green }}</el-checkbox>
            <el-checkbox label="red">{{ red }}</el-checkbox>
            <el-checkbox label="white">{{ white }}</el-checkbox>
          </el-space>
        </el-checkbox-group>
      </el-form-item>
    </template>

    <!-- ========== 锦标赛配置 ========== -->
    <template v-else>
      <el-form-item :label="chipColors">
        <el-checkbox-group
          :model-value="tournamentColors"
          @update:model-value="emit('update:tournamentColors', $event)"
        >
          <el-space size="large">
            <el-checkbox label="green25k">{{ green }}（25k）</el-checkbox>
            <el-checkbox label="red5k">{{ red }}（5k）</el-checkbox>
            <el-checkbox label="yellow1k">{{ gold }}（1k）</el-checkbox>
            <el-checkbox label="purple500">{{ purple }}（500）</el-checkbox>
            <el-checkbox label="black100">{{ black }}（100）</el-checkbox>
          </el-space>
        </el-checkbox-group>
      </el-form-item>
    </template>
  </el-form>
</template>

<style scoped>
  .filters {
    margin-bottom: 12px;
  }
</style>
