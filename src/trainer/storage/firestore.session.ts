// storage/firestore.session.ts
import { addDoc, collection } from 'firebase/firestore'
import { db } from '@/firebase'
import type { Session } from '../session/session.types'
import type { SessionPersister } from './persist.session'

export class FirestoreSessionPersister implements SessionPersister {
  async save(session: Session): Promise<string> {
    const docRef = await addDoc(collection(db, 'training_stats'), session)
    return docRef.id // ⭐️ 关键中的关键
  }
}
