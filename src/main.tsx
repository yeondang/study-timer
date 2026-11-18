import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { applyTheme } from '@/lib/theme'
import { usePrefsStore } from '@/store/usePrefsStore'

applyTheme(usePrefsStore.getState().themeColor)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)