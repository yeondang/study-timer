import { useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { formatDuration } from '@/lib/time'

interface Props {
  secondsMap: Record<string, number> // 날짜 -> 총 공부 초
  selected: string
  onSelect: (date: string) => void
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// 공부 시간에 따라 칸 배경색 진하게
function cellColor(seconds: number): string {
  const h = seconds / 3600
  if (h <= 0) return 'bg-white'
  if (h < 1) return 'bg-blue-50'
  if (h < 3) return 'bg-blue-100'
  if (h < 5) return 'bg-blue-200'
  return 'bg-blue-300'
}

export default function CalendarView({ secondsMap, selected, onSelect }: Props) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const today = format(new Date(), 'yyyy-MM-dd')

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month)),
    end: endOfWeek(endOfMonth(month)),
  })

  const prefix = format(month, 'yyyy-MM')
  const monthTotal = Object.entries(secondsMap)
    .filter(([date]) => date.startsWith(prefix))
    .reduce((sum, [, sec]) => sum + sec, 0)

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setMonth(subMonths(month, 1))}
          className="rounded-lg px-3 py-1 hover:bg-slate-100"
        >
          ◀
        </button>
        <div className="text-center">
          <div className="font-semibold">{format(month, 'yyyy년 M월')}</div>
          <div className="text-xs text-slate-500">이번 달 총 {formatDuration(monthTotal)}</div>
        </div>
        <button
          onClick={() => setMonth(addMonths(month, 1))}
          className="rounded-lg px-3 py-1 hover:bg-slate-100"
        >
          ▶
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-slate-400">
        {WEEKDAYS.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((d) => {
          const key = format(d, 'yyyy-MM-dd')
          const sec = secondsMap[key] ?? 0
          const inMonth = isSameMonth(d, month)
          const isSelected = key === selected

          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={`flex h-16 flex-col items-center justify-start rounded-lg border p-1 text-xs ${cellColor(
                sec
              )} ${inMonth ? '' : 'opacity-30'} ${
                isSelected ? 'border-2 border-blue-600' : 'border-slate-100'
              }`}
            >
              <span className={key === today ? 'font-bold text-blue-600' : ''}>
                {format(d, 'd')}
              </span>
              {sec > 0 && (
                <span className="mt-1 text-[10px] leading-tight text-slate-600">
                  {formatDuration(sec)}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}