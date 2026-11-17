import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Group } from '@/types'

interface GroupRow {
  id: string
  name: string
  invite_code: string
  owner_id: string
}

const toGroup = (r: GroupRow): Group => ({
  id: r.id,
  name: r.name,
  inviteCode: r.invite_code,
  ownerId: r.owner_id,
})

function toKorean(message: string): string {
  if (message.includes('invalid_code')) return '초대 코드가 올바르지 않아요. 다시 확인해 주세요.'
  if (message.includes('not_authenticated')) return '로그인이 필요해요.'
  return message
}

interface Result {
  error: string | null
  id: string | null
}

interface GroupState {
  groups: Group[]
  loaded: boolean
  loadError: string | null

  loadGroups: () => Promise<void>
  clearAll: () => void
  createGroup: (name: string) => Promise<Result>
  joinGroup: (code: string) => Promise<Result>
  leaveGroup: (groupId: string) => Promise<string | null>
  deleteGroup: (groupId: string) => Promise<string | null>
}

export const useGroupStore = create<GroupState>()((set, get) => ({
  groups: [],
  loaded: false,
  loadError: null,

  loadGroups: async () => {
    const { data, error } = await supabase
      .from('groups')
      .select('id,name,invite_code,owner_id')
      .order('created_at')
    if (error) {
      set({ loadError: error.message })
      return
    }
    set({
      groups: (data ?? []).map((r: GroupRow) => toGroup(r)),
      loaded: true,
      loadError: null,
    })
  },

  clearAll: () => set({ groups: [], loaded: false, loadError: null }),

  createGroup: async (name) => {
    const trimmed = name.trim()
    if (trimmed.length < 1 || trimmed.length > 30) {
      return { error: '그룹 이름은 1~30자로 입력해 주세요.', id: null }
    }
    const { data, error } = await supabase.rpc('create_group', { group_name: trimmed })
    if (error) return { error: toKorean(error.message), id: null }
    const row = (Array.isArray(data) ? data[0] : data) as { id?: string } | null
    await get().loadGroups()
    return { error: null, id: row?.id ?? null }
  },

  joinGroup: async (code) => {
    const trimmed = code.trim()
    if (!trimmed) return { error: '초대 코드를 입력해 주세요.', id: null }
    const { data, error } = await supabase.rpc('join_group', { code: trimmed })
    if (error) return { error: toKorean(error.message), id: null }
    const row = (Array.isArray(data) ? data[0] : data) as { id?: string } | null
    await get().loadGroups()
    return { error: null, id: row?.id ?? null }
  },

  // 그룹원이 탈퇴
  leaveGroup: async (groupId) => {
    const { data } = await supabase.auth.getSession()
    const uid = data.session?.user.id
    if (!uid) return '로그인이 필요해요.'
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', uid)
    if (error) return error.message
    await get().loadGroups()
    return null
  },

  // 그룹장이 그룹 삭제 (멤버 정보도 함께 삭제됨)
  deleteGroup: async (groupId) => {
    const { error } = await supabase.from('groups').delete().eq('id', groupId)
    if (error) return error.message
    await get().loadGroups()
    return null
  },
}))