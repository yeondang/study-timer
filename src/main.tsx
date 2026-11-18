import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { applyTheme, applyThemeText } from '@/lib/theme'
import { usePrefsStore } from '@/store/usePrefsStore'

const prefs = usePrefsStore.getState()
applyTheme(prefs.themeColor)
applyThemeText(prefs.themeText)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)