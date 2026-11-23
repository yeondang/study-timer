import { useState } from 'react'
import { format, subDays } from 'date-fns'
import { addAdjustment, adjustRunningTimer, deleteSession } from '@/lib/adjust'
import { formatDuration } from '@/lib/time'
import { useTimerStore } from '@/store/useTimerStore'

export default function AdjustTime({ date }: { date: string }) {
  const subjects = useTimerStore((s) => s.subjects)
  const selectedId = useTimerStore((s) => s.selectedSubjectId)
  const status = useTimerStore((s) => s.status)
  const sessions = useTimerStore((s) => s.sessions)

  const today = format(new Date(), 'yyyy-MM-dd')
  const minDate = format(subDays(new Date(), 30), 'yyyy-MM-dd')

  const [open, setOpen] = useState(false)
  const [d, setD] = useState(date)
  const [subjectId, setSubjectId] = useState('')
  const [sign, setSign] = useState<1 | -1>(1)
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(10)
  const [note, setNote] = useState('')
  const [target, setTarget] = useState<'running' | 'saved'>('saved')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const canRunning = d === today && status !== 'idle'
  const useRunning = canRunning && target === 'running'
  const runningSubject = subjects.find((s) => s.id === selectedId)
  const manuals = sessions.filter((x) => x.studyDate === d && x.kind === 'manual')

  const openModal = () => {
    setD(date)
    setSubjectId(selectedId ?? subjects[0]?.id ?? '')
    setTarget(date === today && status !== 'idle' ? 'running' : 'saved')
    setSign(1)
    setHours(0)
    setMinutes(10)
    setNote('')
    setMsg(null)
    setOpen(true)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    const h = Math.max(0, Math.floor(hours) || 0)
    const m = Math.max(0, Math.floor(minutes) || 0)
    const seconds = sign * (h * 3600 + m * 60)
    if (seconds === 0) {
      setMsg({ ok: false, text: '시간을 입력해 주세요.' })
      return
    }

    setBusy(true)
    const err = useRunning
      ? adjustRunningTimer(seconds)
      : await addAdjustment({ subjectId, date: d, seconds, note })
    setBusy(false)

    if (err) {
      setMsg({ ok: false, text: err })
      return
    }
    setMsg({
      ok: true,
      text: `${formatDuration(Math.abs(seconds))} ${sign === 1 ? '추가' : '차감'}했어요.`,
    })
    setNote('')
  }

  const remove = async (id: string) => {
    if (!confirm('이 조정 내역을 삭제할까요? 시간이 원래대로 돌아가요.')) return
    const err = await deleteSession(id)
    if (err) setMsg({ ok: false, text: err })
  }

  return (
    <>
      <button
        onClick={openModal}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
      >
        ± 시간 조정
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <form
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 text-left shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">공부 시간 조정</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              타이머를 안 멈췄거나 깜빡하고 안 켰을 때 시간을 바로잡아요.
            </p>

            {/* 추가 / 차감 */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {(
                [
                  { v: 1, label: '＋ 시간 추가' },
                  { v: -1, label: '－ 시간 차감' },
                ] as const
              ).map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => setSign(o.v)}
                  className={`rounded-lg border py-2 text-sm font-medium ${
                    sign === o.v
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>

            {/* 대상 (진행 중 타이머 / 저장된 기록) */}
            {canRunning && (
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                {(
                  [
                    { v: 'running', label: '진행 중인 타이머' },
                    { v: 'saved', label: '저장된 기록' },
                  ] as const
                ).map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => setTarget(o.v)}
                    className={`rounded-lg border py-1.5 ${
                      target === o.v
                        ? 'border-slate-800 ring-1 ring-slate-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}

            {useRunning ? (
              <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                지금 측정 중인 <b>{runningSubject?.name ?? '과목'}</b> 타이머의 시간이 바로
                바뀌어요. 종료 · 저장하면 조정된 시간으로 기록돼요.
              </p>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-600">날짜</label>
                  <input
                    type="date"
                    value={d}
                    min={minDate}
                    max={today}
                    onChange={(e) => e.target.value && setD(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">과목</label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-sm"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* 시간 */}
            <div className="mt-3">
              <label className="text-xs font-medium text-slate-600">시간</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={24}
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="w-20 rounded-lg border border-slate-200 px-2 py-2 text-right text-sm outline-none focus:border-blue-500"
                />
                <span className="text-sm text-slate-500">시간</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value))}
                  className="w-20 rounded-lg border border-slate-200 px-2 py-2 text-right text-sm outline-none focus:border-blue-500"
                />
                <span className="text-sm text-slate-500">분</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[5, 10, 20, 30, 60].map((min) => (
                  <button
                    key={min}
                    type="button"
                    onClick={() => {
                      setHours(Math.floor(min / 60))
                      setMinutes(min % 60)
                    }}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    {min >= 60 ? `${min / 60}시간` : `${min}분`}
                  </button>
                ))}
              </div>
            </div>

            {!useRunning && (
              <div className="mt-3">
                <label className="text-xs font-medium text-slate-600">사유 (선택)</label>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={50}
                  placeholder="예: 화장실, 타이머 켜는 걸 깜빡함"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
            )}

            {msg && (
              <p className={`mt-3 text-sm ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>
                {msg.text}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="mt-4 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300"
            >
              {busy ? '처리 중...' : sign === 1 ? '시간 추가하기' : '시간 차감하기'}
            </button>

            {/* 이 날의 조정 내역 */}
            {!useRunning && manuals.length > 0 && (
              <div className="mt-5 border-t border-slate-100 pt-4">
                <div className="mb-2 text-xs font-medium text-slate-600">
                  {d.slice(5).replace('-', '/')} 조정 내역
                </div>
                <ul className="space-y-1.5">
                  {manuals.map((m) => (
                    <li key={m.id} className="flex items-center gap-2 text-sm">
                      <span
                        className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: m.subjectColor }}
                      />
                      <span className="shrink-0">{m.subjectName}</span>
                      <span
                        className={`shrink-0 font-semibold ${
                          m.durationSeconds >= 0 ? 'text-green-600' : 'text-red-500'
                        }`}
                      >
                        {m.durationSeconds >= 0 ? '+' : '-'}
                        {formatDuration(Math.abs(m.durationSeconds))}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-xs text-slate-400">
                        {m.note}
                      </span>
                      <button
                        type="button"
                        onClick={() => remove(m.id)}
                        className="text-xs text-slate-400 hover:text-red-500"
                      >
                        삭제
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </form>
        </div>
      )}
    </>
  )
}