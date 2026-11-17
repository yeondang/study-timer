import { create } from 'zustand'
import { resizeToSquare } from '@/lib/image'
import { supabase } from '@/lib/supabase'

interface ProfileState {
  nickname: string
  avatarUrl: string | null
  statusEmoji: string
  statusText: string
  loaded: boolean

  loadProfile: () => Promise<void>
  clearAll: () => void
  updateNickname: (name: string) => Promise<string | null>
  uploadAvatar: (file: File) => Promise<string | null>
  removeAvatar: () => Promise<string | null>
  setCustomStatus: (emoji: string, text: string) => Promise<string | null>
}

async function myId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.user.id ?? null
}

// 반환값: 오류 메시지 (성공이면 null)
export const useProfileStore = create<ProfileState>()((set) => ({
  nickname: '',
  avatarUrl: null,
  statusEmoji: '',
  statusText: '',
  loaded: false,

  loadProfile: async () => {
    const uid = await myId()
    if (!uid) return
    const { data, error } = await supabase
      .from('profiles')
      .select('nickname,avatar_url,status_emoji,status_text')
      .eq('id', uid)
      .maybeSingle()
    if (error) {
      console.error('[프로필 불러오기 실패]', error.message)
      return
    }
    set({
      nickname: data?.nickname ?? '공부러',
      avatarUrl: data?.avatar_url ?? null,
      statusEmoji: data?.status_emoji ?? '',
      statusText: data?.status_text ?? '',
      loaded: true,
    })
  },

  clearAll: () =>
    set({ nickname: '', avatarUrl: null, statusEmoji: '', statusText: '', loaded: false }),

  updateNickname: async (name) => {
    const trimmed = name.trim()
    if (trimmed.length < 1 || trimmed.length > 20) return '닉네임은 1~20자로 입력해 주세요.'
    const uid = await myId()
    if (!uid) return '로그인이 필요해요.'
    const { error } = await supabase.from('profiles').upsert({ id: uid, nickname: trimmed })
    if (error) return error.message
    set({ nickname: trimmed })
    return null
  },

  uploadAvatar: async (file) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return 'JPG, PNG, WEBP 이미지만 올릴 수 있어요.'
    }
    if (file.size > 10 * 1024 * 1024) return '10MB 이하 이미지를 선택해 주세요.'
    const uid = await myId()
    if (!uid) return '로그인이 필요해요.'

    try {
      const blob = await resizeToSquare(file, 256)
      const path = `${uid}/avatar.jpg`
      const up = await supabase.storage
        .from('avatars')
        .upload(path, blob, { upsert: true, contentType: 'image/jpeg', cacheControl: '3600' })
      if (up.error) return up.error.message

      // 주소 뒤에 시각을 붙여서, 사진을 바꿔도 예전 사진이 캐시로 남지 않게 함
      const url = `${supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl}?v=${Date.now()}`
      const { error } = await supabase.from('profiles').upsert({ id: uid, avatar_url: url })
      if (error) return error.message
      set({ avatarUrl: url })
      return null
    } catch (e) {
      return e instanceof Error ? e.message : '사진을 올리지 못했어요.'
    }
  },

  removeAvatar: async () => {
    const uid = await myId()
    if (!uid) return '로그인이 필요해요.'
    await supabase.storage.from('avatars').remove([`${uid}/avatar.jpg`])
    const { error } = await supabase.from('profiles').upsert({ id: uid, avatar_url: null })
    if (error) return error.message
    set({ avatarUrl: null })
    return null
  },

  setCustomStatus: async (emoji, text) => {
    const e = emoji.trim()
    const t = text.trim()
    if (e.length > 8) return '이모지는 하나만 넣어 주세요.'
    if (t.length > 40) return '상태 문구는 40자 이내로 입력해 주세요.'
    const uid = await myId()
    if (!uid) return '로그인이 필요해요.'
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: uid, status_emoji: e, status_text: t })
    if (error) return error.message
    set({ statusEmoji: e, statusText: t })
    return null
  },
}))