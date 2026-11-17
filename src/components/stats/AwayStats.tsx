import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatDuration } from '@/lib/time'
import type { DayPoint, RangeSummary, SubjectAway } from '@/lib/stats'

interface Props {
  days: DayPoint[]
  summary: RangeSummary
  bySubject: SubjectAway[]
  tickInterval?: number
}

function MiniChart({
  data,
  dataKey,
  color,
  unit,
  tickInterval,
}: {
  data: Record<string, number | string>[]
  dataKey: string
  color: string
  unit: string
  tickInterval: number
}) {
  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={tickInterval} />
          <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
          <Tooltip formatter={(v) => `${v}${unit}`} />
          <Bar dataKey={dataKey} name={dataKey === 'count' ? '이탈' : '자리 비움'} fill={color} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function AwayStats({ days, summary, bySubject, tickInterval = 0 }: Props) {
  const data = days.map((d) => ({
    label: d.label,
    count: d.awayCount,
    minutes: Math.round((d.awaySeconds / 60) * 10) / 10,
  }))

  const cleanRun = summary.total > 0 && summary.awayCount === 0

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="font-semibold">이탈 상세</h2>

      {summary.total === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">이 기간의 공부 기록이 없어요.</p>
      ) : cleanRun ? (
        <p className="py-6 text-center text-sm text-green-600">
          이 기간에는 이탈 기록이 없어요. 집중력이 대단해요! 👏
        </p>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card label="이탈 횟수" value={`${summary.awayCount}회`} />
            <Card label="자리 비움 시간" value={formatDuration(summary.awaySeconds)} />
            <Card label="공부 1시간당 이탈" value={`${summary.awayPerHour.toFixed(1)}회`} />
            <Card
              label="이탈 가장 많은 날"
              value={
                summary.worstAwayDay
                  ? `${summary.worstAwayDay.date.slice(5).replace('-', '/')} (${summary.worstAwayDay.awayCount}회)`
                  : '-'
              }
            />
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="mb-1 text-xs text-slate-500">날짜별 이탈 횟수</div>
              <MiniChart data={data} dataKey="count" color="#d97757" unit="회" tickInterval={tickInterval} />
            </div>
            <div>
              <div className="mb-1 text-xs text-slate-500">날짜별 자리 비움 시간 (분)</div>
              <MiniChart data={data} dataKey="minutes" color="#f59e0b" unit="분" tickInterval={tickInterval} />
            </div>
          </div>

          {bySubject.length > 0 && (
            <div className="mt-5">
              <div className="mb-2 text-xs text-slate-500">과목별 이탈</div>
              <ul className="space-y-1.5">
                {bySubject.map((s) => (
                  <li key={s.subjectId} className="flex items-center gap-2 text-sm">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="flex-1">{s.name}</span>
                    <span className="text-slate-500">{formatDuration(s.seconds)}</span>
                    <span className="w-12 text-right font-semibold">{s.count}회</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  )
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-bold">{value}</div>
    </div>
  )
}