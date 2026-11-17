import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { GroupMember, LiveState, LiveStatus } from '@/types'

interface LiveRow {
  user_id: string
  status: LiveState
  subject_name: string | null
  current_started_at: string | null
  today_seconds: number
  updated_at: string
  custom_emoji?: string | null
  custom_text?: string | null
}

interface ProfileRow {
  id: string
  nickname: string
  avatar_url: string | null
  status_emoji: string | null
  status_text: string | null
}

const toLive = (r: LiveRow): LiveStatus => ({
  userId: r.user_id,
  status: r.status,
  subjectName: r.subject_name,
  currentStartedAt: r.current_started_at ? new Date(r.current_started_at).getTime() : null,
  todaySeconds: r.today_seconds,
  updatedAt: new Date(r.updated_at).getTime(),
  customEmoji: r.custom_emoji ?? '',
  customText: r.custom_text ?? '',
})

export function useGroupMembers(groupId: string | null, ownerId: string | null) {
  const [members, setMembers] = useState<GroupMember[]>([])
  const [live, setLive] = useState<Record<string, LiveStatus>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const idsRef = useRef<Set<string>>(new Set())

  const refresh = useCallback(async () => {
    if (!groupId) return

    const { data: gm, error: e1 } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
    if (e1) {
      setError(e1.message)
      return
    }

    const ids = (gm ?? []).map((r: { user_id: string }) => r.user_id)
    idsRef.current = new Set(ids)
    if (ids.length === 0) {
      setMembers([])
      setLive({})
      return
    }

    const [profRes, liveRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id,nickname,avatar_url,status_emoji,status_text')
        .in('id', ids),
      supabase.from('live_status').select('*').in('user_id', ids),
    ])
    const err = profRes.error ?? liveRes.error
    if (err) {
      setError(err.message)
      return
    }

    const profiles = new Map<string, ProfileRow>(
      ((profRes.data ?? []) as ProfileRow[]).map((p) => [p.id, p])
    )
    setMembers(
      ids.map((id: string) => {
        const p = profiles.get(id)
        return {
          userId: id,
          nickname: p?.nickname ?? '알 수 없음',
          isOwner: id === ownerId,
          avatarUrl: p?.avatar_url ?? null,
          statusEmoji: p?.status_emoji ?? '',
          statusText: p?.status_text ?? '',
        }
      })
    )
    setLive(
      Object.fromEntries(((liveRes.data ?? []) as LiveRow[]).map((r) => [r.user_id, toLive(r)]))
    )
    setError('')
  }, [groupId, ownerId])

  // 그룹을 바꾸면 처음부터 다시 불러오기 + 30초마다 + 탭에 돌아올 때 새로고침
  useEffect(() => {
    if (!groupId) return
    setMembers([])
    setLive({})
    setLoading(true)
    refresh().finally(() => setLoading(false))

    const timer = window.setInterval(refresh, 30_000)
    const onVisible = () => {
      if (!document.hidden) refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [groupId, refresh])

  // 실시간 구독: 그룹원의 상태가 바뀌면 바로 반영
  useEffect(() => {
    if (!groupId) return
    const channel = supabase
      .channel(`live-${groupId}-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'live_status' },
        (payload) => {
          const row = payload.new as Partial<LiveRow>
          if (!row.user_id || !idsRef.current.has(row.user_id)) return
          setLive((prev) => ({ ...prev, [row.user_id as string]: toLive(row as LiveRow) }))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId])

  return { members, live, loading, error, refresh }
}