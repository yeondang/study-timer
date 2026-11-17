import { useEffect, useState } from 'react'
import { isSameDay } from 'date-fns'
import Avatar from '@/components/common/Avatar'
import { formatTime } from '@/lib/time'
import type { GroupMember, LiveState, LiveStatus } from '@/types'

const BADGE: Record<LiveState, { text: string; badge: string; dot: string }> = {
  studying: { text: '공부 중', badge: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  resting: { text: '휴식 중', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
  away: { text: '자리 비움', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  offline: { text: '오프라인', badge: 'bg-slate-100 text-slate-500', dot: 'bg-slate-300' },
}

const RANK: Record<LiveState, number> = { studying: 0, resting: 1, away: 2, offline: 3 }

// 신호가 3분 넘게 끊기면 오프라인으로 간주 (브라우저를 그냥 닫은 경우)
const STALE_MS = 3 * 60 * 1000

function resolve(live: LiveStatus | undefined, now: number) {
  if (!live) return { state: 'offline' as LiveState, seconds: 0, subject: null as string | null }

  const stale = live.status !== 'offline' && now - live.updatedAt > STALE_MS
  const state: LiveState = stale ? 'offline' : live.status

  let seconds = live.todaySeconds
  if (live.currentStartedAt !== null) {
    const end = stale ? live.updatedAt : now
    seconds += Math.max(0, (end - live.currentStartedAt) / 1000)
  }
  // 어제의 기록이면 오늘은 0
  if (state === 'offline' && !isSameDay(live.updatedAt, now)) seconds = 0

  return { state, seconds: Math.floor(seconds), subject: state === 'offline' ? null : live.subjectName }
}

interface Props {
  members: GroupMember[]
  live: Record<string, LiveStatus>
  myId: string
}

export default function MemberStatusList({ members, live, myId }: Props) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const rows = members.map((m) => ({ m, ...resolve(live[m.userId], now) }))
  rows.sort((a, b) => RANK[a.state] - RANK[b.state] || b.seconds - a.seconds)

  const studyingCount = rows.filter((r) => r.state === 'studying').length
  const total = rows.reduce((sum, r) => sum + r.seconds, 0)

  return (
    <div>
      <div className="mb-3 flex justify-between text-sm text-slate-500">
        <span>
          지금 공부 중 <b className="text-slate-700">{studyingCount}명</b> / {rows.length}명
        </span>
        <span>
          그룹 오늘 합계 <b className="text-slate-700">{formatTime(total)}</b>
        </span>
      </div>

      <ul className="space-y-2">
        {rows.map(({ m, state, seconds, subject }) => {
          const b = BADGE[state]
          // 실시간 행이 있으면 그것이 기준, 없으면 프로필에 저장된 값
          const l = live[m.userId]
          const customEmoji = l ? l.customEmoji : m.statusEmoji
          const customText = l ? l.customText : m.statusText
          const hasCustom = Boolean(customEmoji || customText)

          return (
            <li
              key={m.userId}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                m.userId === myId ? 'border-blue-200 bg-blue-50' : 'border-slate-100'
              }`}
            >
              <div className="relative">
                <Avatar url={m.avatarUrl} name={m.nickname} size={44} />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${b.dot}`}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{m.nickname}</span>
                  {m.userId === myId && <span className="text-xs text-blue-600">나</span>}
                  {m.isOwner && <span className="text-xs text-slate-400">👑</span>}
                </div>
                {hasCustom && (
                  <div className="truncate text-xs text-slate-500">
                    {customEmoji} {customText}
                  </div>
                )}
                <div className="mt-1 flex items-center gap-2 text-xs">
                  <span className={`rounded-full px-2 py-0.5 font-medium ${b.badge}`}>
                    {b.text}
                  </span>
                  {subject && <span className="text-slate-500">{subject}</span>}
                </div>
              </div>

              <div className="text-right">
                <div className="font-mono text-lg font-bold tabular-nums">
                  {formatTime(seconds)}
                </div>
                <div className="text-xs text-slate-400">오늘</div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}