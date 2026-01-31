import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase'
import type { TrainingSessionDraft } from '../types/trainingCount.types'

export async function writeTrainingSession<Payload, Mode extends string, SubMode extends string>(
  session: TrainingSessionDraft<Payload, Mode, SubMode>
) {
  const batch = writeBatch(db)

  const sessionRef = doc(db, 'user_sessions', session.summary.sessionId)

  // 1️⃣ 写 session summary
  batch.set(sessionRef, {
    ...session.summary,
    createdAt: serverTimestamp(),
  })

  // 2️⃣ 写 answers 子集合
  const answersCol = collection(sessionRef, 'answers')

  for (const a of session.answers) {
    const answerRef = doc(answersCol)
    batch.set(answerRef, {
      ...a,
      answeredAt: serverTimestamp(),
    })
  }

  await batch.commit()
}
