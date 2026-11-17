import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatDuration } from '@/lib/time'
import type { DayPoint, SubjectStat } from '@/lib/stats'

interface Props {
  days: DayPoint[]
  subjects: SubjectStat[] // 이 기간에 공부한 과목들 (색/이름)
  tickInterval?: number
}

// 세로축 눈금: 1시간 이상이면 "1.5h", 아니면 "30m"
const axisTick = (v: number) => (v >= 3600 ? `${+(v / 3600).toFixed(1)}h` : `${Math.round(v / 60)}m`)

export default function PeriodChart({ days, subjects, tickInterval = 0 }: Props) {
  // 과목별 초를 한 줄(객체)로 펼침. 0인 과목은 키를 넣지 않아 툴팁에 안 나옴
  const data = days.map((d) => ({ label: d.label, ...d.bySubject }))

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={tickInterval} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={axisTick} width={44} />
          <Tooltip formatter={(v) => formatDuration(Number(v))} />
          {subjects.map((s) => (
            <Bar
              key={s.subjectId}
              dataKey={s.subjectId}
              name={s.name}
              stackId="study"
              fill={s.color}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}