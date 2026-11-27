    import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Ann {
  id: string
  title: string
  body: string
  level: 'info' | 'warning' | 'important'
}

const STYLE: Record<Ann['level'], string> = {
  info: 'border-slate-200 bg-white text-slate-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  important: 'border-red-200 bg-red-50 text-red-800',
}
const ICON: Record<Ann['level'], string> = { info: '📢', warning: '⚠️', important: '🚨' }
const KEY = 'dismissed-announcements'

export default function AnnouncementBanner() {
  const [items, setItems] = useState<Ann[]>([])
  const [dismissed, setDismissed] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? '[]')
    } catch {
      return []
    }
  })

  useEffect(() => {
    supabase
      .from('announcements')
      .select('id,title,body,level')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => setItems((data ?? []) as Ann[]))
  }, [])

  const close = (id: string) => {
    const next = [...dismissed, id].slice(-50)
    setDismissed(next)
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      /* 저장 실패해도 무시 */
    }
  }

  const visible = items.filter((a) => !dismissed.includes(a.id))
  if (visible.length === 0) return null

  return (
    <div className="mx-auto max-w-4xl space-y-2 px-6 pt-4">
      {visible.map((a) => (
        <div
          key={a.id}
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${STYLE[a.level]}`}
        >
          <span>{ICON[a.level]}</span>
          <div className="min-w-0 flex-1">
            <div className="font-semibold">{a.title}</div>
            {a.body && <div className="mt-0.5 whitespace-pre-wrap break-words">{a.body}</div>}
          </div>
          <button
            onClick={() => close(a.id)}
            className="shrink-0 opacity-50 hover:opacity-100"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}