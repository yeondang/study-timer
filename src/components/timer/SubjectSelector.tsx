import { useState } from 'react'
import { useTimerStore } from '@/store/useTimerStore'

export default function SubjectSelector() {
  const subjects = useTimerStore((s) => s.subjects)
  const selectedId = useTimerStore((s) => s.selectedSubjectId)
  const status = useTimerStore((s) => s.status)
  const selectSubject = useTimerStore((s) => s.selectSubject)
  const addSubject = useTimerStore((s) => s.addSubject)
  const removeSubject = useTimerStore((s) => s.removeSubject)
  const [name, setName] = useState('')

  const locked = status !== 'idle'

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    addSubject(name)
    setName('')
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="mb-3 font-semibold">과목</h2>

      <div className="flex flex-wrap gap-2">
        {subjects.map((s) => {
          const selected = s.id === selectedId
          return (
            <div
              key={s.id}
              className={`flex items-center overflow-hidden rounded-full border text-sm ${
                selected ? 'border-2 bg-slate-50 font-semibold' : 'border-slate-200'
              } ${locked && !selected ? 'opacity-40' : ''}`}
              style={selected ? { borderColor: s.color } : undefined}
            >
              <button
                type="button"
                disabled={locked}
                onClick={() => selectSubject(s.id)}
                className="flex items-center gap-2 py-1.5 pl-3 pr-2 disabled:cursor-not-allowed"
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.name}
              </button>
              <button
                type="button"
                disabled={locked}
                onClick={() => {
                  if (confirm(`'${s.name}' 과목을 삭제할까요? (공부 기록은 남습니다)`)) {
                    removeSubject(s.id)
                  }
                }}
                className="px-2 py-1.5 text-slate-400 hover:text-red-500 disabled:cursor-not-allowed"
                aria-label={`${s.name} 삭제`}
              >
                ×
              </button>
            </div>
          )
        })}
      </div>

      <form onSubmit={handleAdd} className="mt-4 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="새 과목 이름 (예: 과학)"
          maxLength={20}
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          추가
        </button>
      </form>

      {locked && (
        <p className="mt-3 text-xs text-slate-400">
          공부 중에는 과목을 바꿀 수 없어요. 종료하거나 초기화한 뒤 변경하세요.
        </p>
      )}
    </div>
  )
}