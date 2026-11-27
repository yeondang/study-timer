import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Level = 'info' | 'warning' | 'important'
interface Ann {
  id: string
  title: string
  body: string
  level: Level
  is_active: boolean
  created_at: string
}

const LEVELS: { v: Level; label: string }[] = [
  { v: 'info', label: '📢 일반' },
  { v: 'warning', label: '⚠️ 주의' },
  { v: 'important', label: '🚨 중요' },
]

export default function AnnouncementManager() {
  const [list, setList] = useState<Ann[]>([])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [level, setLevel] = useState<Level>('info')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const load = async () => {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) setMsg(error.message)
    else setList((data ?? []) as Ann[])
  }
  useEffect(() => {
    load()
  }, [])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMsg('')
    const { error } = await supabase
      .from('announcements')
      .insert({ title: title.trim(), body: body.trim(), level })
    setBusy(false)
    if (error) {
      setMsg(error.message)
      return
    }
    setTitle('')
    setBody('')
    setLevel('info')
    load()
  }

  const toggle = async (a: Ann) => {
    const { error } = await supabase
      .from('announcements')
      .update({ is_active: !a.is_active })
      .eq('id', a.id)
    if (error) setMsg(error.message)
    else load()
  }

  const remove = async (a: Ann) => {
    if (!confirm(`'${a.title}' 공지를 삭제할까요?`)) return
    const { error } = await supabase.from('announcements').delete().eq('id', a.id)
    if (error) setMsg(error.message)
    else load()
  }

  return (
    <div className="space-y-4">
      <form onSubmit={create} className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold">새 공지 작성</h2>
        <div className="mt-3 flex gap-2">
          {LEVELS.map((l) => (
            <button
              key={l.v}
              type="button"
              onClick={() => setLevel(l.v)}
              className={`rounded-full border px-3 py-1 text-sm ${
                level === l.v
                  ? 'border-blue-500 bg-blue-50 font-medium text-blue-700'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          placeholder="제목 (80자)"
          className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="내용 (선택, 1000자)"
          className="mt-2 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        {msg && <p className="mt-2 text-sm text-red-600">{msg}</p>}
        <button
          type="submit"
          disabled={busy || !title.trim()}
          className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-slate-300"
        >
          {busy ? '등록 중...' : '공지 등록'}
        </button>
      </form>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold">공지 목록</h2>
        {list.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">등록된 공지가 없어요.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {list.map((a) => (
              <li key={a.id} className="rounded-xl border border-slate-100 p-3">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span>{LEVELS.find((l) => l.v === a.level)?.label.slice(0, 2)}</span>
                      <span className="truncate">{a.title}</span>
                      {!a.is_active && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                          숨김
                        </span>
                      )}
                    </div>
                    {a.body && (
                      <p className="mt-1 whitespace-pre-wrap break-words text-xs text-slate-500">
                        {a.body}
                      </p>
                    )}
                    <div className="mt-1 text-xs text-slate-400">
                      {new Date(a.created_at).toLocaleString('ko-KR')}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2 text-xs">
                    <button onClick={() => toggle(a)} className="text-blue-600 hover:underline">
                      {a.is_active ? '숨기기' : '표시'}
                    </button>
                    <button onClick={() => remove(a)} className="text-slate-400 hover:text-red-500">
                      삭제
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}