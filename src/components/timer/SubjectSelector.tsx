import { useState } from 'react'
import ColorEditor from '@/components/timer/ColorEditor'
import { useTimerStore } from '@/store/useTimerStore'

export default function SubjectSelector() {
  const subjects = useTimerStore((s) => s.subjects)
  const selectedId = useTimerStore((s) => s.selectedSubjectId)
  const status = useTimerStore((s) => s.status)
  const selectSubject = useTimerStore((s) => s.selectSubject)
  const addSubject = useTimerStore((s) => s.addSubject)
  const removeSubject = useTimerStore((s) => s.removeSubject)
  const updateSubjectColor = useTimerStore((s) => s.updateSubjectColor)
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const locked = status !== 'idle'
  const editing = subjects.find((s) => s.id === editingId)

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
              {/* 색 점: 누르면 색상 편집 */}
              <button
                type="button"
                onClick={() => setEditingId(editingId === s.id ? null : s.id)}
                className="py-1.5 pl-3 pr-1"
                aria-label={`${s.name} 색상 변경`}
                title="색상 변경"
              >
                <span
                  className="block h-3.5 w-3.5 rounded-full ring-1 ring-slate-200"
                  style={{ backgroundColor: s.color }}
                />
              </button>
              <button
                type="button"
                disabled={locked}
                onClick={() => selectSubject(s.id)}
                className="py-1.5 pl-1 pr-2 disabled:cursor-not-allowed"
              >
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

      {editing && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">'{editing.name}' 색상</span>
            <button
              onClick={() => setEditingId(null)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              닫기
            </button>
          </div>
          <ColorEditor
            color={editing.color}
            onChange={(hex) => updateSubjectColor(editing.id, hex)}
          />
        </div>
      )}

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

      <p className="mt-3 text-xs text-slate-400">
        색 점을 누르면 색상을 바꿀 수 있어요.
        {locked && ' 공부 중에는 과목 선택·삭제가 잠겨요.'}
      </p>
    </div>
  )
}