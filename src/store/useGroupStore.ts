import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Group } from '@/types'

interface GroupRow {
  id: string
  name: string
  description: string | null
  max_members: number | null
  invite_code: string
  owner_id: string
}

const toGroup = (r: GroupRow): Group => ({
  id: r.id,
  name: r.name,
  description: r.description ?? '',
  maxMembers: r.max_members ?? 20,
  inviteCode: r.invite_code,
  ownerId: r.owner_id,
})

function toKorean(message: string): string {
  if (message.includes('invalid_code')) return '초대 코드가 올바르지 않아요. 다시 확인해 주세요.'
  if (message.includes('group_full')) return '그룹 정원이 가득 찼어요.'
  if (message.includes('max_below_members'))
    return '현재 멤버 수보다 적게 줄일 수 없어요. 먼저 멤버를 내보내 주세요.'
  if (message.includes('not_owner')) return '그룹장만 할 수 있어요.'
  if (message.includes('not_authenticated')) return '로그인이 필요해요.'
  return message
}

interface Result {
  error: string | null
  id: string | null
}

export interface GroupPatch {
  name: string
  description: string
  maxMembers: number
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
  updateGroup: (groupId: string, patch: GroupPatch) => Promise<string | null>
  regenerateCode: (groupId: string) => Promise<string | null>
  kickMember: (groupId: string, userId: string) => Promise<string | null>
}

export const useGroupStore = create<GroupState>()((set, get) => ({
  groups: [],
  loaded: false,
  loadError: null,

  loadGroups: async () => {
    const { data, error } = await supabase
      .from('groups')
      .select('id,name,description,max_members,invite_code,owner_id')
      .order('created_at')
    if (error) {
      set({ loadError: error.message })
      return
    }
    set({
      groups: (data ?? []).map((r) => toGroup(r as GroupRow)),
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

  leaveGroup: async (groupId) => {
    const { data } = await supabase.auth.getSession()
    const uid = data.session?.user.id
    if (!uid) return '로그인이 필요해요.'
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', uid)
    if (error) return toKorean(error.message)
    await get().loadGroups()
    return null
  },

  deleteGroup: async (groupId) => {
    const { error } = await supabase.from('groups').delete().eq('id', groupId)
    if (error) return toKorean(error.message)
    await get().loadGroups()
    return null
  },

  // 그룹장: 이름 / 소개 / 최대 인원 수정
  updateGroup: async (groupId, patch) => {
    const name = patch.name.trim()
    const description = patch.description.trim()
    const max = Math.round(patch.maxMembers)
    if (name.length < 1 || name.length > 30) return '그룹 이름은 1~30자로 입력해 주세요.'
    if (description.length > 200) return '소개는 200자 이내로 입력해 주세요.'
    if (!Number.isFinite(max) || max < 2 || max > 100) return '최대 인원은 2~100명으로 입력해 주세요.'

    const { error } = await supabase
      .from('groups')
      .update({ name, description, max_members: max })
      .eq('id', groupId)
    if (error) return toKorean(error.message)
    await get().loadGroups()
    return null
  },

  // 그룹장: 초대 코드 재발급
  regenerateCode: async (groupId) => {
    const { error } = await supabase.rpc('regenerate_invite_code', { gid: groupId })
    if (error) return toKorean(error.message)
    await get().loadGroups()
    return null
  },

  // 그룹장: 멤버 내보내기
  kickMember: async (groupId, userId) => {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId)
    if (error) return toKorean(error.message)
    return null
  },
}))