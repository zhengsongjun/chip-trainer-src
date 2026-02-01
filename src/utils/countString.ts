export function getModeLabel(mode: string): string {
  switch (mode) {
    case 'chip':
      return '筹码反应'
    default:
      return mode
  }
}
