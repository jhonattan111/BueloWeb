import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { registerBueloLanguage } from '@/lib/buelo-language'

import '@/assets/index.css'

registerBueloLanguage()

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
