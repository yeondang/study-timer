import { formatDuration } from '@/lib/time'
import { useTimerStore } from '@/store/useTimerStore'
import { usePlannerStore } from '@/store/usePlannerStore'

interface Props {
  date: string
  studiedSeconds: Record<string, number> // 과목 id -> 공부한 초
}

export default function GoalSetting({ date, studiedSeconds }: Props) {
  const subjects = useTimerStore((s) => s.subjects)
  const goals = usePlannerStore((s) => s.goals)
  const setGoal = usePlannerStore((s) => s.setGoal)

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="font-semibold">과목별 목표 시간</h2>
      <p className="mt-1 text-sm text-slate-500">분 단위로 입력하세요. 비우면 목표가 사라져요.</p>

      <div className="mt-4 space-y-4">
        {subjects.map((s) => {
          const goal = goals.find((g) => g.subjectId === s.id && g.goalDate === date)
          const goalMin = goal?.goalMinutes ?? 0
          const studied = studiedSeconds[s.id] ?? 0
          const percent = goalMin > 0 ? Math.min(100, (studied / (goalMin * 60)) * 100) : 0
          const achieved = goalMin > 0 && studied >= goalMin * 60

          return (
            <div key={s.id}>
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span className="flex-1 text-sm font-medium">{s.name}</span>
                <input
                  type="number"
                  min={0}
                  max={1440}
                  value={goalMin || ''}
                  onChange={(e) => {
                    const v = Math.min(1440, Math.max(0, Math.floor(Number(e.target.value))))
                    setGoal(s.id, date, v)
                  }}
                  placeholder="0"
                  className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm outline-none focus:border-blue-500"
                />
                <span className="text-sm text-slate-500">분</span>
              </div>

              {goalMin > 0 && (
                <div className="mt-2">
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${percent}%`, backgroundColor: s.color }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-slate-500">
                    <span>
                      {formatDuration(studied)} / {formatDuration(goalMin * 60)}
                    </span>
                    <span className={achieved ? 'font-semibold text-green-600' : ''}>
                      {achieved ? '달성! 🎉' : `${Math.floor(percent)}%`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}