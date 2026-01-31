// store/session.ts
import { TrainingSessionDraft } from '@/trainerCount/types/trainingCount.types'
import { reactive } from 'vue'

export const sessionState = reactive({
  session: null as TrainingSessionDraft | null,
  isSubmitting: false,
})

export const setSession = (session: TrainingSessionDraft | null) => {
  sessionState.session = session
}

export const resetSession = () => {
  sessionState.session = null
}
