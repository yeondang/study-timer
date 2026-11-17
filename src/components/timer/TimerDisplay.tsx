import { formatTime } from '@/lib/time'
import type { TimerStatus } from '@/types'

const STATUS_LABEL: Record<TimerStatus, { text: string; className: string }> = {
  idle: { text: '대기 중', className: 'bg-slate-100 text-slate-600' },
  running: { text: '공부 중', className: 'bg-green-100 text-green-700' },
  paused: { text: '일시정지', className: 'bg-amber-100 text-amber-700' },
  away: { text: '자리 비움', className: 'bg-red-100 text-red-700' },
}

interface Props {
  seconds: number
  status: TimerStatus
  subjectName?: string
  subjectColor?: string
}

export default function TimerDisplay({
  seconds,
  status,
  subjectName,
  subjectColor,
}: Props) {
  const label = STATUS_LABEL[status]

  return (
    <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
      <span
        className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${label.className}`}
      >
        {label.text}
      </span>

      <div className="mt-4 font-mono text-6xl font-bold tabular-nums tracking-tight">
        {formatTime(seconds)}
      </div>

      <div className="mt-3 flex items-center justify-center gap-2 text-slate-600">
        {subjectName ? (
          <>
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: subjectColor }}
            />
            {subjectName}
          </>
        ) : (
          '과목을 선택하세요'
        )}
      </div>
    </div>
  )
}