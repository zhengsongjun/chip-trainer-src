// src/i18n/chipTraining.ts
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export default function useUISystem() {
  const { t } = useI18n()

  return {
    save: computed(() => t('common.save')),
    cancel: computed(() => t('common.cancel')),
  }
}
