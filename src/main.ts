import './assets/main.css'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

import App from './App.vue'
import router from './router'

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  theme: {
    defaultTheme: 'diagonLight',
    themes: {
      diagonLight: {
        dark: false,
        colors: {
          background: '#f9f8f6',
          surface: '#ffffff',
          primary: '#d97706',
          secondary: '#6366f1',
          tertiary: '#fef3c7',
          info: '#3b82f6',
          success: '#16a34a',
          warning: '#d97706',
          error: '#ef4444',
        },
      },
      diagonMid: {
        dark: true,
        colors: {
          background: '#1c1a15',
          surface: '#242018',
          primary: '#f59e0b',
          secondary: '#6366f1',
          tertiary: '#302b1e',
          info: '#3b82f6',
          success: '#16a34a',
          warning: '#f59e0b',
          error: '#ef4444',
        },
      },
      diagonDark: {
        dark: true,
        colors: {
          background: '#0f1117',
          surface: '#181c24',
          primary: '#f59e0b',
          secondary: '#6366f1',
          tertiary: '#1e2433',
          info: '#3b82f6',
          success: '#16a34a',
          warning: '#f59e0b',
          error: '#ef4444',
        },
      },
    },
  },
  defaults: {
    VBtn: {
      rounded: 'lg',
    },
    VCard: {
      rounded: 'xl',
    },
  },
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)

app.mount('#app')
