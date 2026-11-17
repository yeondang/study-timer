import { formatDuration } from '@/lib/time'
import { useTimerStore } from '@/store/useTimerStore'

export default function AwayBadge() {
  const status = useTimerStore((s) => s.status)
  const awayCount = useTimerStore((s) => s.awayCount)
  const awaySeconds = useTimerStore((s) => s.awaySeconds)

  if (status === 'idle') return null

  return (
    <div className="text-center text-sm text-slate-500">
      이탈 <b className="text-slate-700">{awayCount}회</b> · 자리 비움{' '}
      <b className="text-slate-700">{formatDuration(awaySeconds)}</b>
    </div>
  )
}