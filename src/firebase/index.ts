import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyApKIQ66DzjYrs3DxknQLoHJ5r0YnWU7xg',
  authDomain: 'reg-training-tool.firebaseapp.com',
  projectId: 'reg-training-tool',
  storageBucket: 'reg-training-tool.firebasestorage.app',
  messagingSenderId: '799754910087',
  appId: '1:799754910087:web:3784c981ff167d4e543b22',
}

const app = initializeApp(firebaseConfig)

// Firebase Auth（我们后面所有登录都用它）
export const auth = getAuth(app)
