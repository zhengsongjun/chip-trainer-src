/**
 * 每日错题聚合表（wrong_daily）
 *
 * 设计目标：
 * - 1 个用户 + 1 天 = 1 条文档
 * - 只存“错题数量”的聚合结果
 * - 不存题目明细、不存答题顺序
 *
 * 使用场景：
 * - 错题本页面直接读取
 * - 不需要二次计算
 */

export type WrongDailyDoc<Mode extends string = string, SubMode extends string = string> = {
  /**
   * 用户 ID
   */
  userId: string

  /**
   * 日期（按天聚合）
   * 格式：YYYY-MM-DD
   */
  date: string

  /**
   * 当天错题总数
   */
  totalWrong: number

  /**
   * 按 mode 统计的错题数量
   * 例：{ chip: 5, 'board-analysis': 2 }
   */
  byMode: Record<Mode, number>

  /**
   * 按 subMode 统计的错题数量
   * 例：{ cash: 3, tournament: 4 }
   */
  bySubMode: Record<SubMode, number>

  /**
   * 产生错题的 sessionId（兜底用）
   * - 非 UI 必需
   * - 用于调试 / 将来回溯
   */
  sessionIds?: string[]

  /**
   * 最后一次更新时间
   * 通常在 merge 时写入
   */
  updatedAt: number
}
