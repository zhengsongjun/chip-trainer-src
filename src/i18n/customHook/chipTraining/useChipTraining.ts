// src/i18n/chipTraining.ts
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export default function useChipTrainingI18n() {
  const { t } = useI18n()

  return {
    // 页面级
    pageTitle: computed(() => t('chipTraining.pageTitle')),
    chipConfig: computed(() => t('chipTraining.chipConfig')),
    chipLimitConfig: computed(() => t('chipTraining.chipLimitConfig')),
    cashGame: computed(() => t('chipTraining.cashGame')),
    tournamentGame: computed(() => t('chipTraining.tournamentGame')),

    // 颜色
    white: computed(() => t('chipTraining.white')),
    red: computed(() => t('chipTraining.red')),
    green: computed(() => t('chipTraining.green')),
    black: computed(() => t('chipTraining.black')),
    purple: computed(() => t('chipTraining.purple')),
    gold: computed(() => t('chipTraining.gold')),
    pink: computed(() => t('chipTraining.pink')),
    brown: computed(() => t('chipTraining.brown')),
    blue: computed(() => t('chipTraining.blue')),
    orange: computed(() => t('chipTraining.orange')),
    grey: computed(() => t('chipTraining.grey')),

    gameType: computed(() => t('chipTraining.gameType')),
    chipColors: computed(() => t('chipTraining.chipColors')),

    inputPlaceholder: computed(() => t('chipTraining.inputPlaceholder')),
    submit: computed(() => t('chipTraining.submit')),
    next: computed(() => t('chipTraining.next')),
    showAnswer: computed(() => t('chipTraining.showAnswer')),
    hideAnswer: computed(() => t('chipTraining.hideAnswer')),
    correct: computed(() => t('chipTraining.correct')),
    wrong: computed(() => t('chipTraining.wrong')),
    correctAnswer: computed(() => t('chipTraining.correctAnswer')),
  }
}
