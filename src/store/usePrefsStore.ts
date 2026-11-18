import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  applyTheme,
  applyThemeText,
  DEFAULT_THEME,
  DEFAULT_THEME_TEXT,
  type ThemeText,
} from '@/lib/theme'

interface PrefsState {
  themeColor: string
  themeText: ThemeText
  setThemeColor: (hex: string) => void
  setThemeText: (text: ThemeText) => void
  resetTheme: () => void
}

export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      themeColor: DEFAULT_THEME,
      themeText: DEFAULT_THEME_TEXT,

      setThemeColor: (hex) => {
        applyTheme(hex)
        set({ themeColor: hex })
      },

      setThemeText: (text) => {
        applyThemeText(text)
        set({ themeText: text })
      },

      resetTheme: () => {
        applyTheme(DEFAULT_THEME)
        applyThemeText(DEFAULT_THEME_TEXT)
        set({ themeColor: DEFAULT_THEME, themeText: DEFAULT_THEME_TEXT })
      },
    }),
    { name: 'study-ui-prefs' }
  )
)