import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { formatDuration } from '@/lib/time'
import { getElapsedMs, useTimerStore } from '@/store/useTimerStore'
import type { StudySession } from '@/types'

const DAY = 86400

// 저장된 기록에 시간 추가/차감 (seconds: 양수=추가, 음수=차감). 오류 메시지 또는 null
export async function addAdjustment(p: {
  subjectId: string
  date: string
  seconds: number
  note: string
}): Promise<string | null> {
  const st = useTimerStore.getState()
  const subject = st.subjects.find((x) => x.id === p.subjectId)
  if (!subject) return '과목을 선택해 주세요.'
  if (!Number.isInteger(p.seconds) || p.seconds === 0 || Math.abs(p.seconds) > DAY) {
    return '시간은 1분 ~ 24시간 사이로 입력해 주세요.'
  }

  const today = format(new Date(), 'yyyy-MM-dd')
  if (p.date > today) return '미래 날짜는 선택할 수 없어요.'

  const sameDay = st.sessions.filter((x) => x.studyDate === p.date)
  const dayTotal = sameDay.reduce((s, x) => s + x.durationSeconds, 0)
  const subjectTotal = sameDay
    .filter((x) => x.subjectId === subject.id)
    .reduce((s, x) => s + x.durationSeconds, 0)

  if (p.seconds < 0 && subjectTotal + p.seconds < 0) {
    return `이 날 ${subject.name} 기록은 ${formatDuration(subjectTotal)}뿐이라 더 줄일 수 없어요.`
  }
  if (dayTotal + p.seconds > DAY) return '하루 총 공부 시간은 24시간을 넘길 수 없어요.'

  const at = p.date === today ? new Date() : new Date(`${p.date}T12:00:00`)
  const note = p.note.trim().slice(0, 50)

  const { data, error } = await supabase
    .from('study_sessions')
    .insert({
      subject_id: subject.id,
      subject_name: subject.name,
      subject_color: subject.color,
      study_date: p.date,
      started_at: at.toISOString(),
      ended_at: at.toISOString(),
      duration_seconds: p.seconds,
      away_count: 0,
      away_seconds: 0,
      kind: 'manual',
      note,
    })
    .select('id')
    .single()

  if (error || !data) return error?.message ?? '저장하지 못했어요.'

  const session: StudySession = {
    id: data.id as string,
    subjectId: subject.id,
    subjectName: subject.name,
    subjectColor: subject.color,
    studyDate: p.date,
    startedAt: at.getTime(),
    endedAt: at.getTime(),
    durationSeconds: p.seconds,
    awayCount: 0,
    awaySeconds: 0,
    kind: 'manual',
    note,
  }
  useTimerStore.setState((s) => ({ sessions: [...s.sessions, session] }))
  return null
}

// 지금 돌아가는 타이머에서 시간 더하기/빼기
export function adjustRunningTimer(deltaSeconds: number): string | null {
  const s = useTimerStore.getState()
  if (s.status === 'idle') return '타이머가 꺼져 있어요.'
  if (Math.abs(deltaSeconds) > DAY) return '24시간 이내로 입력해 주세요.'
  const next = getElapsedMs(s) + deltaSeconds * 1000
  if (next < 0) return '지금까지 측정된 시간보다 더 줄일 수 없어요.'
  useTimerStore.setState({ accumulatedMs: s.accumulatedMs + deltaSeconds * 1000 })
  return null
}

// 조정 내역 삭제 (되돌리기)
export async function deleteSession(id: string): Promise<string | null> {
  const target = useTimerStore.getState().sessions.find((x) => x.id === id)
  if (!target || target.kind !== 'manual') return '조정 내역만 삭제할 수 있어요.'

  // 추가했던 시간을 지우면 그 날 과목 기록이 음수가 될 수 있으니 확인
  if (target.durationSeconds > 0) {
    const rest = useTimerStore
      .getState()
      .sessions.filter(
        (x) => x.studyDate === target.studyDate && x.subjectId === target.subjectId && x.id !== id
      )
      .reduce((s, x) => s + x.durationSeconds, 0)
    if (rest < 0) return '이 조정을 지우면 기록이 음수가 돼서 삭제할 수 없어요. 차감 내역을 먼저 지워 주세요.'
  }

  const { error } = await supabase.from('study_sessions').delete().eq('id', id)
  if (error) return error.message
  useTimerStore.setState((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) }))
  return null
}