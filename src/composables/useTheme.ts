import { ref } from 'vue'

export type ThemeMode = 'light' | 'mid' | 'dark'

export const themeMode = ref<ThemeMode>(
  (localStorage.getItem('pos-theme') as ThemeMode) || 'light',
)

export function initTheme() {
  document.documentElement.setAttribute('data-theme', themeMode.value)
}

export function cycleTheme() {
  const order: ThemeMode[] = ['light', 'mid', 'dark']
  const next = order[(order.indexOf(themeMode.value) + 1) % order.length] as ThemeMode
  themeMode.value = next
  localStorage.setItem('pos-theme', next)
  document.documentElement.setAttribute('data-theme', next)
}
