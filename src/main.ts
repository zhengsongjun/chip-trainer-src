import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPersist from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router/index.ts'
import ElementPlus from 'element-plus'
import i18n from './i18n/config'

import 'element-plus/dist/index.css'
import '@/styles/index.css'
import { setupBeaconGuard } from './trainer'

const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPersist)

app.use(pinia)
app.use(ElementPlus)
app.use(i18n)
app.use(router)

app.mount('#app')
setupBeaconGuard()
