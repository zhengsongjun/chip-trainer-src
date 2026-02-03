import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPersist from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router/index.ts'
import ElementPlus from 'element-plus'
import i18n from './i18n/config'
import { useTrainingRuntimeStore } from '@/stores/trainingRuntime'

import 'element-plus/dist/index.css'
import '@/styles/index.css'

const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPersist)

app.use(pinia)
app.use(ElementPlus)
app.use(i18n)
app.use(router)
app.mount('#app')
const runtimeStore = useTrainingRuntimeStore(pinia)
window.addEventListener('beforeunload', () => {
  if (runtimeStore.activeSession) {
    navigator.sendBeacon(
      import.meta.env.VITE_FIREBASE_FALLBACK_URL,
      JSON.stringify({
        activeSession: runtimeStore.activeSession,
        dailyStatsDelta: runtimeStore.dailyStatsDelta,
        wrongDailyDelta: runtimeStore.wrongDailyDelta,
      })
    )
    runtimeStore.reset()
  }
})
