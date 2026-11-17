import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { SubjectGoal, Todo } from '@/types'

interface TodoRow {
  id: string
  subject_id: string | null
  title: string
  todo_date: string
  is_done: boolean
}

const toTodo = (r: TodoRow): Todo => ({
  id: r.id,
  subjectId: r.subject_id,
  title: r.title,
  todoDate: r.todo_date,
  isDone: r.is_done,
})

interface PlannerState {
  todos: Todo[]
  goals: SubjectGoal[]
  loaded: boolean
  loadError: string | null

  loadAll: () => Promise<void>
  clearAll: () => void
  addTodo: (title: string, date: string, subjectId: string | null) => Promise<void>
  toggleTodo: (id: string) => Promise<void>
  removeTodo: (id: string) => Promise<void>
  setGoal: (subjectId: string, date: string, minutes: number) => void
}

let loadedUserId: string | null = null
let loadingPromise: Promise<void> | null = null
const goalTimers = new Map<string, number>()

// 목표 시간은 숫자를 입력하는 동안 여러 번 바뀌므로, 멈춘 뒤 0.7초 후 한 번만 저장
function saveGoalLater(subjectId: string, date: string, minutes: number) {
  const key = `${subjectId}|${date}`
  window.clearTimeout(goalTimers.get(key))
  goalTimers.set(
    key,
    window.setTimeout(async () => {
      goalTimers.delete(key)
      const res =
        minutes > 0
          ? await supabase
              .from('subject_goals')
              .upsert(
                { subject_id: subjectId, goal_date: date, goal_minutes: minutes },
                { onConflict: 'subject_id,goal_date' }
              )
          : await supabase
              .from('subject_goals')
              .delete()
              .eq('subject_id', subjectId)
              .eq('goal_date', date)
      if (res.error) console.error('[목표 저장 실패]', res.error.message)
    }, 700)
  )
}

export const usePlannerStore = create<PlannerState>()((set, get) => ({
  todos: [],
  goals: [],
  loaded: false,
  loadError: null,

  loadAll: async () => {
    const { data: sessionData } = await supabase.auth.getSession()
    const uid = sessionData.session?.user.id
    if (!uid) return
    if (loadedUserId === uid) return
    if (loadingPromise) return loadingPromise

    loadingPromise = (async () => {
      set({ loadError: null })
      const [todoRes, goalRes] = await Promise.all([
        supabase.from('todos').select('*').order('created_at').limit(5000),
        supabase.from('subject_goals').select('subject_id,goal_date,goal_minutes').limit(5000),
      ])
      const err = todoRes.error ?? goalRes.error
      if (err) {
        set({ loadError: err.message })
        return
      }
      set({
        todos: ((todoRes.data ?? []) as TodoRow[]).map(toTodo),
        goals: (goalRes.data ?? []).map((g) => ({
          subjectId: g.subject_id as string,
          goalDate: g.goal_date as string,
          goalMinutes: g.goal_minutes as number,
        })),
        loaded: true,
      })
      loadedUserId = uid
    })().finally(() => {
      loadingPromise = null
    })

    return loadingPromise
  },

  clearAll: () => {
    loadedUserId = null
    set({ todos: [], goals: [], loaded: false, loadError: null })
  },

  addTodo: async (title, date, subjectId) => {
    const trimmed = title.trim()
    if (!trimmed) return
    const { data, error } = await supabase
      .from('todos')
      .insert({ title: trimmed, todo_date: date, subject_id: subjectId })
      .select('*')
      .single()
    if (error || !data) {
      alert(`할 일을 추가하지 못했어요: ${error?.message ?? ''}`)
      return
    }
    set({ todos: [...get().todos, toTodo(data as TodoRow)] })
  },

  // 체크는 바로 화면에 반영하고, 저장에 실패하면 되돌림
  toggleTodo: async (id) => {
    const target = get().todos.find((t) => t.id === id)
    if (!target) return
    const next = !target.isDone
    const apply = (value: boolean) =>
      set({ todos: get().todos.map((t) => (t.id === id ? { ...t, isDone: value } : t)) })

    apply(next)
    const { error } = await supabase.from('todos').update({ is_done: next }).eq('id', id)
    if (error) {
      apply(!next)
      alert(`저장하지 못했어요: ${error.message}`)
    }
  },

  removeTodo: async (id) => {
    const { error } = await supabase.from('todos').delete().eq('id', id)
    if (error) {
      alert(`삭제하지 못했어요: ${error.message}`)
      return
    }
    set({ todos: get().todos.filter((t) => t.id !== id) })
  },

  // 화면에는 바로 반영, DB 저장은 잠깐 뒤에. 하루에 과목당 목표 1개, 0분이면 삭제
  setGoal: (subjectId, date, minutes) => {
    const rest = get().goals.filter((g) => !(g.subjectId === subjectId && g.goalDate === date))
    set({
      goals: minutes > 0 ? [...rest, { subjectId, goalDate: date, goalMinutes: minutes }] : rest,
    })
    saveGoalLater(subjectId, date, minutes)
  },
}))