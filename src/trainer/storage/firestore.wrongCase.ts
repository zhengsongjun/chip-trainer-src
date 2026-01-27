import { collection, addDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import type { DetailPersister } from './persist.detail'

export interface WrongCaseDetail {
  category: string
  key: string
  payload: unknown
  createdAt: number
  mode: string
  subMode: string
}

export class FirestoreWrongCasePersister {
  async save(trainingStatsId: string, wrongCases: any[]) {
    console.log('[debug:wrongCase.save]', {
      trainingStatsId,
      count: wrongCases.length,
    })
    if (!trainingStatsId) return
    if (!wrongCases.length) return

    const colRef = collection(db, 'training_stats', trainingStatsId, 'wrong_case')

    for (const wrongCase of wrongCases) {
      await addDoc(colRef, wrongCase)
    }
  }
}
