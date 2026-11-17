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
}

const toLive = (r: LiveRow): LiveStatus => ({
  userId: r.user_id,
  status: r.status,
  subjectName: r.subject_name,
  currentStartedAt: r.current_started_at ? new Date(r.current_started_at).getTime() : null,
  todaySeconds: r.today_seconds,
  updatedAt: new Date(r.updated_at).getTime(),
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
      supabase.from('profiles').select('id,nickname').in('id', ids),
      supabase.from('live_status').select('*').in('user_id', ids),
    ])
    const err = profRes.error ?? liveRes.error
    if (err) {
      setError(err.message)
      return
    }

    const nicknames = new Map<string, string>(
      (profRes.data ?? []).map((p: { id: string; nickname: string }) => [p.id, p.nickname])
    )
    setMembers(
      ids.map((id: string) => ({
        userId: id,
        nickname: nicknames.get(id) ?? '알 수 없음',
        isOwner: id === ownerId,
      }))
    )
    setLive(
      Object.fromEntries(
        (liveRes.data ?? []).map((r: LiveRow) => [r.user_id, toLive(r)])
      )
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