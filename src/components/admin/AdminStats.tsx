import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDuration } from '@/lib/time'

interface Stats {
  users: number
  new_7d: number
  studying_now: number
  today_seconds: number
  groups: number
  open_reports: number
}

export default function AdminStats() {
  const [s, setS] = useState<Stats | null>(null)
  const [error, setError] = useState('')

  const load = async () => {
    const { data, error } = await supabase.rpc('admin_stats')
    if (error) setError(error.message)
    else {
      setError('')
      setS(data as Stats)
    }
  }
  useEffect(() => {
    load()
  }, [])

  const cards = s
    ? [
        { label: '전체 유저', value: `${s.users}명` },
        { label: '최근 7일 가입', value: `${s.new_7d}명` },
        { label: '지금 공부 중', value: `${s.studying_now}명` },
        { label: '오늘 총 공부 시간', value: formatDuration(Number(s.today_seconds)) },
        { label: '그룹 수', value: `${s.groups}개` },
        { label: '미처리 제보', value: `${s.open_reports}건` },
      ]
    : []

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">현황</h2>
        <button
          onClick={load}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
        >
          새로고침
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl bg-slate-50 p-4">
            <div className="text-xs text-slate-500">{c.label}</div>
            <div className="mt-1 text-xl font-bold">{c.value}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-400">"오늘"은 한국 시간(KST) 기준이에요.</p>
    </section>
  )
}