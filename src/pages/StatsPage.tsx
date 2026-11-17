import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import CalendarView from '@/components/stats/CalendarView'
import SubjectPieChart from '@/components/stats/SubjectPieChart'
import { secondsByDate, subjectStatsOfDate } from '@/lib/stats'
import { formatDuration } from '@/lib/time'
import { useTimerStore } from '@/store/useTimerStore'

export default function StatsPage() {
  const sessions = useTimerStore((s) => s.sessions)
  const [selected, setSelected] = useState(format(new Date(), 'yyyy-MM-dd'))

  const secondsMap = secondsByDate(sessions)
  const stats = subjectStatsOfDate(sessions, selected)
  const total = secondsMap[selected] ?? 0

  const daySessions = sessions.filter((s) => s.studyDate === selected)
  const awayCount = daySessions.reduce((sum, s) => sum + s.awayCount, 0)
  const awaySeconds = daySessions.reduce((sum, s) => sum + s.awaySeconds, 0)

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">📊 통계</h1>

      <CalendarView secondsMap={secondsMap} selected={selected} onSelect={setSelected} />

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold">{format(parseISO(selected), 'M월 d일')} 기록</h2>

        {total === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">
            이 날의 공부 기록이 없어요. 타이머에서 "종료 · 저장"을 누르면 기록돼요.
          </p>
        ) : (
          <>
            <div className="mt-2 text-3xl font-bold">{formatDuration(total)}</div>
            <div className="mt-1 text-sm text-slate-500">
              이탈 {awayCount}회 · 자리 비움 {formatDuration(awaySeconds)}
            </div>
            <div className="mt-4">
              <SubjectPieChart data={stats} />
            </div>
          </>
        )}
      </section>
    </div>
  )
}