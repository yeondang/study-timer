import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { publishOffline } from '@/lib/liveStatus'
import { supabase } from '@/lib/supabase'
import { useGroupStore } from '@/store/useGroupStore'
import { usePlannerStore } from '@/store/usePlannerStore'
import { useTimerStore } from '@/store/useTimerStore'

interface AuthState {
  session: Session | null
  loading: boolean
  init: () => () => void
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>()((set) => ({
  session: null,
  loading: true,

  init: () => {
    supabase.auth.getSession().then(({ data }) => {
      set({ session: data.session, loading: false })
    })

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, loading: false })
      if (!session) {
        useTimerStore.getState().clearAll()
        usePlannerStore.getState().clearAll()
        useGroupStore.getState().clearAll()
      }
    })

    return () => data.subscription.unsubscribe()
  },

  signOut: async () => {
    await publishOffline() // 로그아웃 전에 그룹원에게 "오프라인"으로 표시
    await supabase.auth.signOut()
  },
}))