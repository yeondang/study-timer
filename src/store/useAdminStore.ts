import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

interface AdminState {
  isAdmin: boolean
  checked: boolean
  check: () => Promise<void>
  clear: () => void
}

export const useAdminStore = create<AdminState>()((set) => ({
  isAdmin: false,
  checked: false,
  // 서버(DB)에 "나 관리자 맞나요?" 물어봄. 화면 표시용이고 실제 보호는 DB가 함
  check: async () => {
    const { data, error } = await supabase.rpc('is_admin')
    set({ isAdmin: !error && data === true, checked: true })
  },
  clear: () => set({ isAdmin: false, checked: false }),
}))