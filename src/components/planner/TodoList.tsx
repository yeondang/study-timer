import { useState } from 'react'
import { useTimerStore } from '@/store/useTimerStore'
import { usePlannerStore } from '@/store/usePlannerStore'
import type { Todo } from '@/types'

export default function TodoList({ date }: { date: string }) {
  const subjects = useTimerStore((s) => s.subjects)
  const todos = usePlannerStore((s) => s.todos)
  const addTodo = usePlannerStore((s) => s.addTodo)
  const toggleTodo = usePlannerStore((s) => s.toggleTodo)
  const removeTodo = usePlannerStore((s) => s.removeTodo)

  const [title, setTitle] = useState('')
  const [subjectId, setSubjectId] = useState('')

  const list = todos.filter((t) => t.todoDate === date)
  const doneCount = list.filter((t) => t.isDone).length

  // 과목별 묶음 만들기 (과목 순서 유지, 과목 없는 것은 마지막)
  const groups: { key: string; name: string; color: string; items: Todo[] }[] = subjects
    .map((s) => ({
      key: s.id,
      name: s.name,
      color: s.color,
      items: list.filter((t) => t.subjectId === s.id),
    }))
    .filter((g) => g.items.length > 0)

  const known = new Set(subjects.map((s) => s.id))
  const noSubject = list.filter((t) => !t.subjectId || !known.has(t.subjectId))
  if (noSubject.length > 0) {
    groups.push({ key: 'none', name: '과목 없음', color: '#94A3B8', items: noSubject })
  }

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    addTodo(title, date, subjectId || null)
    setTitle('')
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">할 일</h2>
        <span className="text-sm text-slate-500">
          {doneCount} / {list.length} 완료
        </span>
      </div>

      <form onSubmit={handleAdd} className="mt-3 flex flex-wrap gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="할 일을 입력하세요"
          maxLength={60}
          className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
        >
          <option value="">과목 없음</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          추가
        </button>
      </form>

      {list.length === 0 && (
        <p className="py-6 text-center text-sm text-slate-400">
          이 날의 할 일이 없어요. 위에서 추가해 보세요.
        </p>
      )}

      <div className="mt-4 space-y-5">
        {groups.map((g) => {
          const done = g.items.filter((t) => t.isDone).length
          return (
            <div key={g.key}>
              <div className="mb-2 flex items-center gap-2 text-sm">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: g.color }}
                />
                <span className="font-semibold">{g.name}</span>
                <span className="text-xs text-slate-400">
                  {done}/{g.items.length}
                </span>
              </div>

              <ul className="space-y-2">
                {g.items.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2"
                    style={{ borderLeft: `4px solid ${g.color}` }}
                  >
                    <input
                      type="checkbox"
                      checked={t.isDone}
                      onChange={() => toggleTodo(t.id)}
                      className="h-4 w-4"
                    />
                    <span
                      className={`flex-1 text-sm ${
                        t.isDone ? 'text-slate-400 line-through' : ''
                      }`}
                    >
                      {t.title}
                    </span>
                    <button
                      onClick={() => removeTodo(t.id)}
                      className="text-slate-300 hover:text-red-500"
                      aria-label="삭제"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}