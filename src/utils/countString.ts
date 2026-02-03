export function getModeLabel(mode: string): string {
  switch (mode) {
    case 'chip':
      return '筹码反应'
    case 'board-analysis':
      return '牌面分析'
    case 'cash':
      return '现金赛'
    case 'tournament':
      return '锦标赛'
    default:
      return mode
  }
}
