import { useState } from 'react'
import {
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns'

import CalendarView from '@/components/stats/CalendarView'
import PeriodChart from '@/components/stats/PeriodChart'
import SubjectPieChart from '@/components/stats/SubjectPieChart'
import {
  buildDaily,
  secondsByDate,
  subjectStatsOfDate,
  subjectStatsOfRange,
  summarize,
} from '@/lib/stats'
import { formatDuration } from '@/lib/time'
import { useTimerStore } from '@/store/useTimerStore'

type Tab = 'day' | 'week' | 'month'

const TABS: { value: Tab; label: string }[] = [
  { value: 'day', label: '일별' },
  { value: 'week', label: '주간' },
  { value: 'month', label: '월간' },
]

const key = (d: Date) => format(d, 'yyyy-MM-dd')

// 기준 날짜가 속한 주(월~일) 또는 달의 시작/끝
function getRange(tab: 'week' | 'month', anchor: Date) {
  return tab === 'week'
    ? { start: startOfWeek(anchor, { weekStartsOn: 1 }), end: endOfWeek(anchor, { weekStartsOn: 1 }) }
    : { start: startOfMonth(anchor), end: endOfMonth(anchor) }
}

export default function StatsPage() {
  const sessions = useTimerStore((s) => s.sessions)
  const [tab, setTab] = useState<Tab>('day')
  const [selected, setSelected] = useState(key(new Date()))
  const [anchor, setAnchor] = useState(() => new Date())

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">📊 통계</h1>

      <div className="inline-flex gap-1 rounded-xl bg-slate-200/60 p-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => {
              setTab(t.value)
              setAnchor(new Date())
            }}
            className={`rounded-lg px-5 py-1.5 text-sm font-medium ${
              tab === t.value ? 'bg-white shadow-sm' : 'text-slate-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'day' ? (
        <DayView sessions={sessions} selected={selected} onSelect={setSelected} />
      ) : (
        <PeriodView
          key={tab}
          tab={tab}
          anchor={anchor}
          setAnchor={setAnchor}
          sessions={sessions}
        />
      )}

      <p className="text-xs text-slate-400">
        "종료 · 저장"을 누른 기록만 통계에 반영돼요. 지금 진행 중인 공부는 저장 후에 나타나요.
      </p>
    </div>
  )
}

// ---------------- 일별 (기존 화면) ----------------
function DayView({
  sessions,
  selected,
  onSelect,
}: {
  sessions: ReturnType<typeof useTimerStore.getState>['sessions']
  selected: string
  onSelect: (d: string) => void
}) {
  const secondsMap = secondsByDate(sessions)
  const stats = subjectStatsOfDate(sessions, selected)
  const total = secondsMap[selected] ?? 0

  const daySessions = sessions.filter((s) => s.studyDate === selected)
  const awayCount = daySessions.reduce((sum, s) => sum + s.awayCount, 0)
  const awaySeconds = daySessions.reduce((sum, s) => sum + s.awaySeconds, 0)

  return (
    <>
      <CalendarView secondsMap={secondsMap} selected={selected} onSelect={onSelect} />

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
    </>
  )
}

// ---------------- 주간 / 월간 ----------------
function PeriodView({
  tab,
  anchor,
  setAnchor,
  sessions,
}: {
  tab: 'week' | 'month'
  anchor: Date
  setAnchor: (d: Date) => void
  sessions: ReturnType<typeof useTimerStore.getState>['sessions']
}) {
  const isWeek = tab === 'week'
  const { start, end } = getRange(tab, anchor)
  const prev = getRange(tab, isWeek ? subWeeks(anchor, 1) : subMonths(anchor, 1))

  const days = buildDaily(sessions, start, end, isWeek ? 'E' : 'd')
  const prevDays = buildDaily(sessions, prev.start, prev.end, 'd')
  const summary = summarize(days)
  const prevTotal = summarize(prevDays).total

  const startKey = key(start)
  const endKey = key(end)
  const subjectStats = subjectStatsOfRange(sessions, startKey, endKey)


  const move = (dir: 1 | -1) =>
    setAnchor(isWeek ? (dir === 1 ? addWeeks(anchor, 1) : subWeeks(anchor, 1)) : dir === 1 ? addMonths(anchor, 1) : subMonths(anchor, 1))

  const title = isWeek
    ? `${format(start, 'M월 d일')} ~ ${format(end, 'M월 d일')}`
    : format(start, 'yyyy년 M월')

  const isCurrent = startKey <= key(new Date()) && key(new Date()) <= endKey
  const diff = summary.total - prevTotal
  const prevLabel = isWeek ? '지난주' : '지난달'

  return (
    <>
      {/* 기간 이동 */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => move(-1)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
        >
          ◀
        </button>
        <div className="min-w-44 text-center font-semibold">{title}</div>
        <button
          onClick={() => move(1)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
        >
          ▶
        </button>
        {!isCurrent && (
          <button
            onClick={() => setAnchor(new Date())}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {isWeek ? '이번 주' : '이번 달'}
          </button>
        )}
      </div>

      {/* 요약 */}
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="text-sm text-slate-500">총 공부 시간</div>
        <div className="mt-1 text-3xl font-bold">{formatDuration(summary.total)}</div>
        {(summary.total > 0 || prevTotal > 0) && (
          <div className={`mt-1 text-sm ${diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {prevLabel}보다 {diff >= 0 ? '+' : '-'}
            {formatDuration(Math.abs(diff))}
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <Stat label="공부한 날" value={`${summary.studyDays}일`} />
          <Stat label="공부한 날 평균" value={formatDuration(summary.avgPerStudyDay)} />
          <Stat
            label="최고 기록"
            value={summary.best ? formatDuration(summary.best.total) : '-'}
            sub={summary.best ? summary.best.date.slice(5).replace('-', '/') : undefined}
          />
        </div>
      </section>

      {/* 막대 그래프 */}
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold">날짜별 공부 시간</h2>
        {summary.total === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">이 기간의 공부 기록이 없어요.</p>
        ) : (
          <div className="mt-3">
            <PeriodChart days={days} subjects={subjectStats} tickInterval={isWeek ? 0 : 1} />
          </div>
        )}
      </section>

      {/* 과목 비율 */}
      {summary.total > 0 && (
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-semibold">과목별 비율</h2>
          <div className="mt-3">
            <SubjectPieChart data={subjectStats} />
          </div>
        </section>
      )}

      
    </>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 font-bold">{value}</div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
    </div>
  )
}