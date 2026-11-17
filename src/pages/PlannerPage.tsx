import { useState } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import GoalSetting from '@/components/planner/GoalSetting'
import TodoList from '@/components/planner/TodoList'
import { useElapsedSeconds } from '@/hooks/useElapsedSeconds'
import { useTimerStore } from '@/store/useTimerStore'

const fmt = (d: Date) => format(d, 'yyyy-MM-dd')

export default function PlannerPage() {
  const today = fmt(new Date())
  const [date, setDate] = useState(today)

  const sessions = useTimerStore((s) => s.sessions)
  const status = useTimerStore((s) => s.status)
  const selectedId = useTimerStore((s) => s.selectedSubjectId)
  const elapsed = useElapsedSeconds()

  // 선택한 날짜의 과목별 공부 시간
  const studied: Record<string, number> = {}
  for (const s of sessions) {
    if (s.studyDate === date) {
      studied[s.subjectId] = (studied[s.subjectId] ?? 0) + s.durationSeconds
    }
  }
  // 오늘이고 타이머가 진행 중이면 지금 공부 중인 시간도 반영
  if (date === today && status !== 'idle' && selectedId) {
    studied[selectedId] = (studied[selectedId] ?? 0) + elapsed
  }

  const move = (days: number) => setDate(fmt(addDays(parseISO(date), days)))

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">📝 플래너</h1>

      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => move(-1)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
        >
          ◀
        </button>
        <input
          type="date"
          value={date}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        />
        <button
          onClick={() => move(1)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
        >
          ▶
        </button>
        {date !== today && (
          <button
            onClick={() => setDate(today)}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            오늘
          </button>
        )}
      </div>

      <TodoList date={date} />
      <GoalSetting date={date} studiedSeconds={studied} />
    </div>
  )
}