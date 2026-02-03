<script setup lang="ts">
  import { computed, nextTick, ref } from 'vue'
  import type { ElTree } from 'element-plus'

  const props = defineProps<{
    modelValue: boolean
    value: Record<string, boolean> // subMode -> checked
    tree: Record<
      string,
      {
        key: string
        label: string
      }[]
    >
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', v: boolean): void
    (e: 'update:value', v: Record<string, boolean>): void
    (e: 'confirm', v: Record<string, boolean>): void
  }>()

  const innerVisible = computed({
    get: () => props.modelValue,
    set: (v) => emit('update:modelValue', v),
  })

  const treeRef = ref<InstanceType<typeof ElTree> | null>(null)

  const treeData = computed(() => {
    return Object.entries(props.tree).map(([mode, subModes]) => ({
      key: mode,
      label: mode === 'chip' ? '筹码错题' : '牌面分析错题',
      children: subModes.map((m) => ({
        key: m.key,
        label: m.label,
      })),
    }))
  })

  async function onOpen() {
    await nextTick()
    const checkedKeys = Object.entries(props.value)
      .filter(([, v]) => v)
      .map(([k]) => k)

    treeRef.value?.setCheckedKeys(checkedKeys, false)
  }

  function confirm() {
    const checked = new Set<string>((treeRef.value?.getCheckedKeys(false) as string[]) || [])

    const result: Record<string, boolean> = {}

    for (const subModes of Object.values(props.tree)) {
      for (const m of subModes) {
        result[m.key] = checked.has(m.key)
      }
    }

    emit('update:value', result)
    emit('confirm', result)
    innerVisible.value = false
  }
</script>

<template>
  <el-dialog
    v-model="innerVisible"
    title="选择练习版块"
    width="520px"
    class="column-dialog"
    :close-on-click-modal="false"
    @open="onOpen"
  >
    <div class="dialog-body">
      <div class="tree-wrap">
        <el-tree
          ref="treeRef"
          class="column-tree"
          :data="treeData"
          node-key="key"
          show-checkbox
          :default-expand-all="true"
          :check-strictly="false"
          :props="treeProps"
        />
      </div>
      <!-- 
      <div class="tree-actions">
        <el-button size="small" @click="checkAll">全选</el-button>
        <el-button size="small" @click="uncheckAll">全不选</el-button>
        <el-button size="small" @click="resetToDefault">重置</el-button>
      </div> -->
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="innerVisible = false">取消</el-button>
        <el-button type="primary" @click="confirm">确认</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style>
  /* dialog：只调整内部排版（遵循 tokens，克制） */
  .column-dialog .el-dialog {
    border-radius: 16px;
    border: 1px solid var(--border);
    box-shadow: var(--shadow-md);
  }

  /* 标题与内容区留白更规整 */
  .column-dialog .el-dialog__header {
    padding: 18px 20px 10px;
  }

  .column-dialog .el-dialog__body {
    padding: 12px 20px 18px;
  }

  .column-dialog .el-dialog__footer {
    padding: 10px 20px 18px;
  }

  /* 主体布局 */
  .dialog-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* 树容器：更“舞台托底”但不抢 ui-panel */
  .tree-wrap {
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.66);
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.04),
      0 10px 20px rgba(0, 0, 0, 0.06);
  }

  /* Tree 本身不做花活，只微调可读性 */
  .column-tree {
    width: 100%;
  }

  /* 树节点行距、悬停与勾选态更稳重 */
  .column-dialog .el-tree-node__content {
    height: 34px;
    border-radius: 10px;
    padding-right: 8px;
  }

  .column-dialog .el-tree-node__content:hover {
    background: rgba(255, 255, 255, 0.7);
  }

  .column-dialog .el-tree-node.is-current > .el-tree-node__content {
    background: rgba(255, 255, 255, 0.75);
  }

  /* checkbox 间距更紧凑一点 */
  .column-dialog .el-checkbox {
    margin-right: 8px;
  }

  /* 操作区：像工具条，不像一排散按钮 */
  .tree-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.6);
  }

  /* 按钮保持一致的触感与圆角（不做渐变、不做夸张） */
  .column-dialog .el-button {
    border-radius: 10px;
  }

  /* footer：对齐更干净 */
  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  /* 小屏兼容：按钮区更容易换行 */
  @media (max-width: 480px) {
    .tree-actions {
      gap: 6px;
      padding: 10px;
    }
  }
</style>
