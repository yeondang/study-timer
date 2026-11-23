import { format } from 'date-fns'
import SubjectSelector from '@/components/timer/SubjectSelector'
import TimerDisplay from '@/components/timer/TimerDisplay'
import { useElapsedSeconds } from '@/hooks/useElapsedSeconds'
import { formatDuration } from '@/lib/time'
import { useTimerStore } from '@/store/useTimerStore'
import QuickSearchWidget from '@/components/tools/QuickSearchWidget'
import AdjustTime from '@/components/timer/AdjustTime'

export default function TimerPage() {
  const seconds = useElapsedSeconds()

  const status = useTimerStore((s) => s.status)
  const subjects = useTimerStore((s) => s.subjects)
  const selectedId = useTimerStore((s) => s.selectedSubjectId)
  const sessions = useTimerStore((s) => s.sessions)
  const start = useTimerStore((s) => s.start)
  const pause = useTimerStore((s) => s.pause)
  const reset = useTimerStore((s) => s.reset)
  const finish = useTimerStore((s) => s.finish)

  const subject = subjects.find((s) => s.id === selectedId)
  const idle = status === 'idle'

  // 오늘 저장된 기록 + 지금 진행 중인 시간
  const today = format(new Date(), 'yyyy-MM-dd')
  const savedToday = sessions
    .filter((s) => s.studyDate === today)
    .reduce((sum, s) => sum + s.durationSeconds, 0)
  const todayTotal = savedToday + (idle ? 0 : seconds)

  const handleReset = () => {
    if (confirm('초기화하면 이번 공부 기록이 저장되지 않고 사라집니다. 계속할까요?')) {
      reset()
    }
  }

  return (
    <div className="space-y-4 p-6">
      <TimerDisplay
        seconds={seconds}
        status={status}
        subjectName={subject?.name}
        subjectColor={subject?.color}
      />

      <div className="flex flex-wrap justify-center gap-3">
        {status === 'running' ? (
          <button
            onClick={pause}
            className="rounded-xl bg-amber-500 px-8 py-3 font-semibold text-white hover:bg-amber-600"
          >
            일시정지
          </button>
        ) : (
          <button
            onClick={start}
            disabled={!selectedId}
            className="rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {idle ? '시작' : '계속'}
          </button>
        )}

        <button
          onClick={finish}
          disabled={idle}
          className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          종료 · 저장
        </button>

        <button
          onClick={handleReset}
          disabled={idle}
          className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
        >
          초기화
        </button>
      </div>

      <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
        <div className="text-sm text-slate-500">오늘 누적 공부 시간</div>
        <div className="mt-1 text-2xl font-bold">{formatDuration(todayTotal)}</div>
        <div className="mt-3">
          <AdjustTime date={today} />
        </div>
      </div>

      <SubjectSelector />

      <QuickSearchWidget />
      
    </div>
  )
}