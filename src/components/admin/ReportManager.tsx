import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Report {
  id: string
  user_id: string
  kind: 'bug' | 'idea' | 'other'
  message: string
  page_url: string | null
  user_agent: string | null
  status: 'open' | 'done'
  created_at: string
}

const KIND: Record<Report['kind'], string> = { bug: '🐞 버그', idea: '💡 건의', other: '💬 기타' }

export default function ReportManager() {
  const [reports, setReports] = useState<Report[]>([])
  const [names, setNames] = useState<Record<string, string>>({})
  const [onlyOpen, setOnlyOpen] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    const { data, error } = await supabase
      .from('bug_reports')
      .select('id,user_id,kind,message,page_url,user_agent,status,created_at')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) {
      setError(error.message)
      return
    }
    const rows = (data ?? []) as Report[]
    setReports(rows)

    const ids = [...new Set(rows.map((r) => r.user_id))]
    if (ids.length > 0) {
      const { data: profs } = await supabase.from('profiles').select('id,nickname').in('id', ids)
      setNames(
        Object.fromEntries((profs ?? []).map((p: { id: string; nickname: string }) => [p.id, p.nickname]))
      )
    }
  }
  useEffect(() => {
    load()
  }, [])

  const toggle = async (r: Report) => {
    const { error } = await supabase
      .from('bug_reports')
      .update({ status: r.status === 'open' ? 'done' : 'open' })
      .eq('id', r.id)
    if (error) setError(error.message)
    else load()
  }

  const remove = async (r: Report) => {
    if (!confirm('이 제보를 삭제할까요?')) return
    const { error } = await supabase.from('bug_reports').delete().eq('id', r.id)
    if (error) setError(error.message)
    else load()
  }

  const shown = onlyOpen ? reports.filter((r) => r.status === 'open') : reports

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">버그 제보 / 건의</h2>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={onlyOpen}
            onChange={(e) => setOnlyOpen(e.target.checked)}
          />
          미처리만 보기
        </label>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {shown.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">제보가 없어요.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {shown.map((r) => (
            <li
              key={r.id}
              className={`rounded-xl border p-3 ${
                r.status === 'done' ? 'border-slate-100 opacity-60' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-medium text-slate-700">{KIND[r.kind]}</span>
                <span>{names[r.user_id] ?? '알 수 없음'}</span>
                <span>{new Date(r.created_at).toLocaleString('ko-KR')}</span>
                {r.status === 'done' && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700">처리됨</span>
                )}
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm">{r.message}</p>
              {r.page_url && (
                <p className="mt-2 break-all text-xs text-slate-400">페이지: {r.page_url}</p>
              )}
              {r.user_agent && (
                <p className="break-all text-xs text-slate-300">{r.user_agent}</p>
              )}
              <div className="mt-2 flex gap-3 text-xs">
                <button onClick={() => toggle(r)} className="text-blue-600 hover:underline">
                  {r.status === 'open' ? '처리 완료로 표시' : '다시 열기'}
                </button>
                <button onClick={() => remove(r)} className="text-slate-400 hover:text-red-500">
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}