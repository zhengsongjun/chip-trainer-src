// persist.session.ts
import { addDoc, collection } from 'firebase/firestore'
import { db } from '@/firebase'

export async function persistSession(stats: TrainingStats): Promise<string> {
  const docRef = await addDoc(collection(db, 'training_stats'), stats)

  return docRef.id // ⭐️ 关键
}
