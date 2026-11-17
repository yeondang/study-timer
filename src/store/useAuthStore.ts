import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { usePlannerStore } from '@/store/usePlannerStore'
import { useTimerStore } from '@/store/useTimerStore'

interface AuthState {
  session: Session | null
  loading: boolean // 로그인 상태를 확인하는 중
  init: () => () => void
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>()((set) => ({
  session: null,
  loading: true,

  // 앱 시작 시 한 번 호출. 반환값은 "구독 해제" 함수
  init: () => {
    supabase.auth.getSession().then(({ data }) => {
      set({ session: data.session, loading: false })
    })

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, loading: false })
      // 로그아웃되면 이전 사용자의 데이터와 타이머를 화면에서 비움
      if (!session) {
        useTimerStore.getState().clearAll()
        usePlannerStore.getState().clearAll()
      }
    })

    return () => data.subscription.unsubscribe()
  },

  signOut: async () => {
    await supabase.auth.signOut()
  },
}))