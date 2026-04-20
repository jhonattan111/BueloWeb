import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { registerBueloLanguage } from '@/lib/buelo-language'
import { useReportStore } from '@/stores/reportStore'

import '@/assets/index.css'

registerBueloLanguage()

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.mount('#app')

// Load supported output formats after pinia is ready
const reportStore = useReportStore()
reportStore.loadFormats()
