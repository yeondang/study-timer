import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { eachDayOfInterval, format, parseISO, subDays } from 'date-fns'
import Avatar from '@/components/common/Avatar'
import { useGroupHistory } from '@/hooks/useGroupHistory'
import { formatDuration } from '@/lib/time'
import type { GroupMember } from '@/types'

const COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899',
  '#14B8A6', '#F97316', '#6366F1', '#84CC16', '#06B6D4', '#A855F7',
]

const axisTick = (v: number) => (v >= 3600 ? `${+(v / 3600).toFixed(1)}h` : `${Math.round(v / 60)}m`)

interface Props {
  groupId: string
  members: GroupMember[]
  myId: string
}

export default function GroupHistory({ groupId, members, myId }: Props) {
  const [days, setDays] = useState<7 | 30>(7)
  const [selected, setSelected] = useState('all')
  const { rows, loading, error, reload } = useGroupHistory(groupId, days)

  const dayKeys = useMemo(
    () =>
      eachDayOfInterval({ start: subDays(new Date(), days - 1), end: new Date() }).map((d) =>
        format(d, 'yyyy-MM-dd')
      ),
    [days]
  )

  // 사용자 -> { 날짜: 초 }
  const secs = useMemo(() => {
    const m = new Map<string, Record<string, number>>()
    for (const r of rows) {
      const per = m.get(r.uid) ?? {}
      per[r.day] = r.seconds
      m.set(r.uid, per)
    }
    return m
  }, [rows])

  const stats = members
    .map((m, i) => {
      const per = secs.get(m.userId) ?? {}
      const total = dayKeys.reduce((s, k) => s + (per[k] ?? 0), 0)
      const active = dayKeys.filter((k) => (per[k] ?? 0) > 0).length
      return { m, color: COLORS[i % COLORS.length], total, active, avg: active ? Math.round(total / active) : 0 }
    })
    .sort((a, b) => b.total - a.total)

  const sel = selected !== 'all' && stats.some((s) => s.m.userId === selected) ? selected : 'all'
  const shown = sel === 'all' ? stats : stats.filter((s) => s.m.userId === sel)
  const groupTotal = stats.reduce((s, x) => s + x.total, 0)
  const maxTotal = Math.max(1, ...stats.map((s) => s.total))

  const chartData = dayKeys.map((k) => {
    const row: Record<string, string | number> = {
      label: format(parseISO(k), days === 7 ? 'M/d' : 'd'),
    }
    for (const s of shown) row[s.m.userId] = secs.get(s.m.userId)?.[k] ?? 0
    return row
  })

  // 선택한 대상의 날짜별 합계
  const dayTotals = dayKeys.map((k) => ({
    key: k,
    seconds: shown.reduce((sum, s) => sum + (secs.get(s.m.userId)?.[k] ?? 0), 0),
  }))
  const maxDay = Math.max(1, ...dayTotals.map((d) => d.seconds))

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">공부 시간 히스토리</h2>
        <div className="flex items-center gap-2">
          <div className="inline-flex gap-1 rounded-xl bg-slate-200/60 p-1">
            {([7, 30] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`rounded-lg px-3 py-1 text-sm font-medium ${
                  days === d ? 'bg-white shadow-sm' : 'text-slate-500'
                }`}
              >
                {d}일
              </button>
            ))}
          </div>
          <button
            onClick={reload}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
          >
            새로고침
          </button>
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-4 grid grid-cols-2 gap-3 text-center">
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-xs text-slate-500">그룹 총 공부 시간</div>
          <div className="mt-1 text-lg font-bold">{formatDuration(groupTotal)}</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-xs text-slate-500">하루 평균 (그룹 전체)</div>
          <div className="mt-1 text-lg font-bold">{formatDuration(Math.round(groupTotal / days))}</div>
        </div>
      </div>

      {/* 멤버 선택 */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setSelected('all')}
          className={`rounded-full px-3 py-1 text-sm ${
            sel === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          전체
        </button>
        {stats.map((s) => (
          <button
            key={s.m.userId}
            onClick={() => setSelected(s.m.userId)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm ${
              sel === s.m.userId
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.m.nickname}
          </button>
        ))}
      </div>

      {/* 그래프 */}
      <div className="mt-4 h-60">
        {loading && rows.length === 0 ? (
          <p className="py-20 text-center text-sm text-slate-400">불러오는 중...</p>
        ) : groupTotal === 0 ? (
          <p className="py-20 text-center text-sm text-slate-400">이 기간의 공부 기록이 없어요.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={days === 7 ? 0 : 1} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={axisTick} width={44} />
              <Tooltip formatter={(v) => formatDuration(Number(v))} />
              {shown.map((s) => (
                <Bar
                  key={s.m.userId}
                  dataKey={s.m.userId}
                  name={s.m.nickname}
                  stackId="g"
                  fill={s.color}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 멤버 순위 */}
      <div className="mt-5">
        <div className="mb-2 text-xs font-medium text-slate-500">멤버별 합계 (눌러서 자세히 보기)</div>
        <ul className="space-y-2">
          {stats.map((s, i) => (
            <li key={s.m.userId}>
              <button
                onClick={() => setSelected(s.m.userId)}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left ${
                  sel === s.m.userId ? 'border-blue-300 bg-blue-50' : 'border-slate-100 hover:bg-slate-50'
                }`}
              >
                <span className="w-5 text-center text-sm font-bold text-slate-400">{i + 1}</span>
                <Avatar url={s.m.avatarUrl} name={s.m.nickname} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{s.m.nickname}</span>
                    {s.m.userId === myId && <span className="text-xs text-blue-600">나</span>}
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(s.total / maxTotal) * 100}%`, backgroundColor: s.color }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">{formatDuration(s.total)}</div>
                  <div className="text-xs text-slate-400">
                    {s.active}일 · 평균 {formatDuration(s.avg)}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* 날짜별 목록 */}
      <div className="mt-5">
        <div className="mb-2 text-xs font-medium text-slate-500">
          날짜별 ({sel === 'all' ? '그룹 전체' : stats.find((s) => s.m.userId === sel)?.m.nickname})
        </div>
        <ul className="max-h-64 space-y-1 overflow-y-auto pr-1">
          {[...dayTotals].reverse().map((d) => (
            <li key={d.key} className="flex items-center gap-3 text-sm">
              <span className="w-12 shrink-0 text-slate-500">{d.key.slice(5).replace('-', '/')}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${(d.seconds / maxDay) * 100}%` }}
                />
              </div>
              <span className="w-20 shrink-0 text-right font-medium">
                {d.seconds > 0 ? formatDuration(d.seconds) : '-'}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-4 text-xs text-slate-400">
        "종료 · 저장"한 기록과 시간 조정이 반영돼요. 진행 중인 공부는 저장 후에 나타나요. 그룹원에게는
        날짜별 합계만 공개되고 과목 정보는 공개되지 않아요.
      </p>
    </section>
  )
}