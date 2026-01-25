import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export default function useBoardAnalysisTrainingI18n() {
  const { t } = useI18n()

  return {
    // 页面级
    pageTitle: computed(() => t('boardAnalysisTraining.pageTitle')),
    trainingMode: computed(() => t('boardAnalysisTraining.trainingMode')),
    type: computed(() => t('boardAnalysisTraining.type')),
    playerCount: computed(() => t('boardAnalysisTraining.playerCount')),

    // 操作按钮
    submit: computed(() => t('boardAnalysisTraining.submit')),
    nextQuestion: computed(() => t('boardAnalysisTraining.nextQuestion')),
    verify: computed(() => t('boardAnalysisTraining.verify')),
    reset: computed(() => t('boardAnalysisTraining.reset')),
    close: computed(() => t('boardAnalysisTraining.close')),

    // 牌面结构
    textureAnalysis: computed(() => t('boardAnalysisTraining.textureAnalysis')),
    pair: computed(() => t('boardAnalysisTraining.pair')),
    flush: computed(() => t('boardAnalysisTraining.flush')),
    straightPotential: computed(() => t('boardAnalysisTraining.straightPotential')),
    straightFlushPotential: computed(() => t('boardAnalysisTraining.straightFlushPotential')),

    // 缺张说明
    straightGutshotExample: computed(() => t('boardAnalysisTraining.straightGutshotExample')),
    straightFlushGutshotExample: computed(() =>
      t('boardAnalysisTraining.straightFlushGutshotExample')
    ),

    // 标记 / 规则
    markHigh: computed(() => t('boardAnalysisTraining.markHigh')),
    markLow: computed(() => t('boardAnalysisTraining.markLow')),
    kill: computed(() => t('boardAnalysisTraining.kill')),

    // 面板提示

    noStraightPotential: computed(() => t('boardAnalysisTraining.noStraightPotential')),
    noStraightFlushPossible: computed(() => t('boardAnalysisTraining.noStraightFlushPossible')),
    straightGapInputRule: computed(() => t('boardAnalysisTraining.straightGapInputRule')),
    missingCombination: computed(() => t('boardAnalysisTraining.missingCombination')),
    //有/无
    yes: computed(() => t('boardAnalysisTraining.yes')),
    no: computed(() => t('boardAnalysisTraining.no')),
  }
}
