import ElementPlus from 'element-plus'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/index'
import 'element-plus/dist/index.css'
import '@/styles/index.css'
import i18n from './i18n/config'
const app = createApp(App)
app.use(ElementPlus, {})
app.use(createPinia())
app.use(router)

app.mount('#app')
app.use(i18n)
