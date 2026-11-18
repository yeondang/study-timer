import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { applyTheme, DEFAULT_THEME } from '@/lib/theme'

interface PrefsState {
  themeColor: string
  setThemeColor: (hex: string) => void
  resetTheme: () => void
}

export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      themeColor: DEFAULT_THEME,

      setThemeColor: (hex) => {
        applyTheme(hex)
        set({ themeColor: hex })
      },

      resetTheme: () => {
        applyTheme(DEFAULT_THEME)
        set({ themeColor: DEFAULT_THEME })
      },
    }),
    { name: 'study-ui-prefs' }
  )
)