import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type Kind = 'bug' | 'idea' | 'other'

const KINDS: { value: Kind; label: string }[] = [
  { value: 'bug', label: '🐞 버그' },
  { value: 'idea', label: '💡 건의' },
  { value: 'other', label: '💬 기타' },
]

export default function BugReportButton() {
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState<Kind>('bug')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)

  const close = () => {
    setOpen(false)
    setResult(null)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = message.trim()
    if (text.length < 5) {
      setResult({ ok: false, text: '내용을 5자 이상 적어 주세요.' })
      return
    }
    setBusy(true)
    setResult(null)
    const { error } = await supabase.from('bug_reports').insert({
      kind,
      message: text,
      page_url: window.location.href,
      user_agent: navigator.userAgent.slice(0, 300),
    })
    setBusy(false)

    if (error) {
      setResult({ ok: false, text: `전송하지 못했어요: ${error.message}` })
      return
    }
    setMessage('')
    setResult({ ok: true, text: '제보가 접수됐어요. 고마워요! 🙏' })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-xl text-white shadow-lg hover:bg-blue-700"
        aria-label="버그 제보 / 건의"
        title="버그 제보 / 건의"
      >
        💬
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={close}
        >
          <form
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">버그 제보 / 건의</h2>
              <button
                type="button"
                onClick={close}
                className="text-slate-400 hover:text-slate-600"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 flex gap-2">
              {KINDS.map((k) => (
                <button
                  key={k.value}
                  type="button"
                  onClick={() => setKind(k.value)}
                  className={`rounded-full border px-3 py-1 text-sm ${
                    kind === k.value
                      ? 'border-blue-500 bg-blue-50 font-medium text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {k.label}
                </button>
              ))}
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={1000}
              rows={5}
              placeholder={
                kind === 'bug'
                  ? '어떤 상황에서 어떤 문제가 생겼는지 적어 주세요.'
                  : '자유롭게 적어 주세요.'
              }
              className="mt-3 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            <div className="mt-1 text-right text-xs text-slate-400">{message.length} / 1000</div>

            {result && (
              <p className={`mt-2 text-sm ${result.ok ? 'text-green-600' : 'text-red-600'}`}>
                {result.text}
              </p>
            )}

            <p className="mt-2 text-xs text-slate-400">
              현재 페이지 주소와 브라우저 정보가 함께 전송돼요.
            </p>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                닫기
              </button>
              <button
                type="submit"
                disabled={busy || message.trim().length < 5}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-slate-300"
              >
                {busy ? '보내는 중...' : '보내기'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}