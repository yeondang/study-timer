import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useTimerStore } from '@/store/useTimerStore'
import type { LiveState } from '@/types'

function buildSnapshot(forceOffline: boolean) {
  const s = useTimerStore.getState()
  const today = format(new Date(), 'yyyy-MM-dd')

  // 오늘 "종료 · 저장"된 시간
  const savedToday = s.sessions
    .filter((x) => x.studyDate === today)
    .reduce((sum, x) => sum + x.durationSeconds, 0)

  let status: LiveState
  if (forceOffline || s.status === 'idle') status = 'offline'
  else if (s.awayStartedAt !== null) status = 'away'
  else if (s.status === 'paused') status = 'resting'
  else if (s.status === 'away') status = 'away'
  else status = 'studying'

  const subject = s.subjects.find((x) => x.id === s.selectedSubjectId)
  const live = !forceOffline && s.status !== 'idle'
  const running = live && s.status === 'running' && s.runStartedAt !== null

  return {
    status,
    subject_name: live ? (subject?.name ?? null) : null,
    // 달리는 중일 때만 시작 시각을 저장 (그룹원 화면에서 시계 계산용)
    current_started_at: running ? new Date(s.runStartedAt as number).toISOString() : null,
    today_seconds: savedToday + (live ? Math.floor(s.accumulatedMs / 1000) : 0),
  }
}

async function publish(forceOffline: boolean) {
  try {
    const { data } = await supabase.auth.getSession()
    const uid = data.session?.user.id
    if (!uid) return

    const { error } = await supabase.from('live_status').upsert({
      user_id: uid,
      ...buildSnapshot(forceOffline),
      updated_at: new Date().toISOString(),
    })
    if (error) console.error('[상태 저장 실패]', error.message)
  } catch (e) {
    console.error('[상태 저장 실패]', e)
  }
}

export const publishStatus = () => publish(false)
export const publishOffline = () => publish(true)