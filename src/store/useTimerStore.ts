import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import type { Settings, StudySession, Subject, TimerStatus } from '@/types'

const SUBJECT_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
]

// 처음 접속했을 때 자동으로 만들어 줄 기본 과목
const DEFAULT_SUBJECTS = [
  { name: '국어', color: SUBJECT_COLORS[1] },
  { name: '수학', color: SUBJECT_COLORS[0] },
  { name: '영어', color: SUBJECT_COLORS[2] },
]

// 이탈 감지 기본값: 유예 30초, 모드 pause
export const DEFAULT_SETTINGS: Settings = {
  awayMode: 'pause',
  graceSeconds: 30,
}

// 학습 도구(사전/구글)를 연 뒤 이탈로 보지 않는 최대 시간 (5분)
export const TOOL_ALLOWANCE_MS = 5 * 60 * 1000

// 타이머가 "대기" 상태일 때의 값 (초기화/종료 때 재사용)
const IDLE_TIMER = {
  status: 'idle' as TimerStatus,
  sessionStartedAt: null as number | null,
  runStartedAt: null as number | null,
  accumulatedMs: 0,
  awayCount: 0,
  awaySeconds: 0,
  awayStartedAt: null as number | null,
}

// DB 한 줄(snake_case) -> 앱에서 쓰는 모양(camelCase)
interface SessionRow {
  id: string
  subject_id: string | null
  subject_name: string
  subject_color: string
  study_date: string
  started_at: string
  ended_at: string
  duration_seconds: number
  away_count: number
  away_seconds: number
}

function toSession(r: SessionRow): StudySession {
  return {
    id: r.id,
    // 과목이 삭제돼 subject_id가 null이면 이름으로 구분해서 통계에 남김
    subjectId: r.subject_id ?? `deleted-${r.subject_name}`,
    subjectName: r.subject_name,
    subjectColor: r.subject_color,
    studyDate: r.study_date,
    startedAt: new Date(r.started_at).getTime(),
    endedAt: new Date(r.ended_at).getTime(),
    durationSeconds: r.duration_seconds,
    awayCount: r.away_count,
    awaySeconds: r.away_seconds,
  }
}

interface TimerState {
  // ----- DB에서 불러오는 데이터 -----
  subjects: Subject[]
  selectedSubjectId: string | null
  sessions: StudySession[]
  settings: Settings
  loaded: boolean
  loadError: string | null

  // ----- 지금 돌아가는 타이머 (localStorage) -----
  status: TimerStatus
  sessionStartedAt: number | null
  runStartedAt: number | null
  accumulatedMs: number
  awayCount: number
  awaySeconds: number
  awayStartedAt: number | null
  toolOpenUntil: number | null

  loadAll: () => Promise<void>
  clearAll: () => void

  addSubject: (name: string) => Promise<void>
  removeSubject: (id: string) => Promise<void>
  selectSubject: (id: string) => void
  updateSubjectColor: (id: string, color: string) => void
  start: () => void
  pause: () => void
  reset: () => void
  finish: () => Promise<void>

  updateSettings: (patch: Partial<Settings>) => void
  resetSettings: () => void
  enterAway: (at: number) => void
  returnFromAway: (now: number) => void
  markToolOpened: () => void
  clearToolFlag: () => void
}

// 지금까지 공부한 시간(ms) 계산
export function getElapsedMs(
  s: { status: TimerStatus; runStartedAt: number | null; accumulatedMs: number },
  now: number = Date.now()
): number {
  const running = s.status === 'running' && s.runStartedAt !== null
  return s.accumulatedMs + (running ? now - (s.runStartedAt as number) : 0)
}

// ---------- 모듈 내부용 변수 ----------
let loadingPromise: Promise<void> | null = null // 동시에 두 번 불러오는 것 방지
let loadedUserId: string | null = null
let finishing = false // "종료 · 저장" 두 번 눌림 방지
let settingsTimer: number | undefined
const colorTimers = new Map<string, number>()

// 색상은 슬라이더를 움직이는 동안 계속 바뀌므로, 멈춘 뒤 0.6초 후 한 번만 저장
function saveSubjectColorLater(id: string, color: string) {
  window.clearTimeout(colorTimers.get(id))
  colorTimers.set(
    id,
    window.setTimeout(async () => {
      colorTimers.delete(id)
      const r1 = await supabase.from('subjects').update({ color }).eq('id', id)
      // 지난 공부 기록의 색도 같이 바꿔서 통계 색이 일치하게 함
      const r2 = await supabase
        .from('study_sessions')
        .update({ subject_color: color })
        .eq('subject_id', id)
      if (r1.error || r2.error) console.error('[색상 저장 실패]', r1.error ?? r2.error)
    }, 600)
  )
}

// 설정은 슬라이더를 움직이는 동안 여러 번 바뀌므로, 멈춘 뒤 0.6초 후에 한 번만 저장
function saveSettingsLater(settings: Settings) {
  window.clearTimeout(settingsTimer)
  settingsTimer = window.setTimeout(async () => {
    const { data } = await supabase.auth.getSession()
    const uid = data.session?.user.id
    if (!uid) return
    const { error } = await supabase.from('profiles').upsert({
      id: uid,
      away_mode: settings.awayMode,
      grace_seconds: settings.graceSeconds,
    })
    if (error) console.error('[설정 저장 실패]', error.message)
  }, 600)
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      subjects: [],
      selectedSubjectId: null,
      sessions: [],
      settings: DEFAULT_SETTINGS,
      loaded: false,
      loadError: null,
      toolOpenUntil: null,
      ...IDLE_TIMER,

      // ---------- DB 불러오기 / 비우기 ----------
      loadAll: async () => {
        const { data: sessionData } = await supabase.auth.getSession()
        const uid = sessionData.session?.user.id
        if (!uid) return
        if (loadedUserId === uid) return // 이미 불러옴
        if (loadingPromise) return loadingPromise // 불러오는 중이면 그 결과를 기다림

        loadingPromise = (async () => {
          set({ loadError: null })

          const [subRes, sesRes, profRes] = await Promise.all([
            supabase
              .from('subjects')
              .select('id,name,color')
              .eq('is_archived', false)
              .order('created_at'),
            supabase
              .from('study_sessions')
              .select('*')
              .order('started_at')
              .limit(5000),
            supabase
              .from('profiles')
              .select('away_mode,grace_seconds')
              .eq('id', uid)
              .maybeSingle(),
          ])

          const err = subRes.error ?? sesRes.error ?? profRes.error
          if (err) {
            set({ loadError: err.message })
            return
          }

          let subjects = (subRes.data ?? []) as Subject[]

          // 과목이 하나도 없으면 기본 과목 만들기
          if (subjects.length === 0) {
            const { data, error } = await supabase
              .from('subjects')
              .insert(DEFAULT_SUBJECTS)
              .select('id,name,color')
            if (error) {
              set({ loadError: error.message })
              return
            }
            subjects = (data ?? []) as Subject[]
          }

          const prof = profRes.data
          const settings: Settings = prof
            ? {
                awayMode: prof.away_mode,
                graceSeconds: prof.grace_seconds,
              }
            : DEFAULT_SETTINGS

          const selected = get().selectedSubjectId
          const validSelected = subjects.some((s) => s.id === selected)

          set({
            subjects,
            sessions: ((sesRes.data ?? []) as SessionRow[]).map(toSession),
            settings,
            selectedSubjectId: validSelected ? selected : (subjects[0]?.id ?? null),
            loaded: true,
          })
          loadedUserId = uid
        })().finally(() => {
          loadingPromise = null
        })

        return loadingPromise
      },

      // 로그아웃 시 화면 데이터와 타이머를 모두 비움
      clearAll: () => {
        loadedUserId = null
        set({
          subjects: [],
          sessions: [],
          settings: DEFAULT_SETTINGS,
          selectedSubjectId: null,
          loaded: false,
          loadError: null,
          toolOpenUntil: null,
          ...IDLE_TIMER,
        })
      },

      // ---------- 과목 ----------
      addSubject: async (name) => {
        const trimmed = name.trim()
        if (!trimmed) return
        const color = SUBJECT_COLORS[get().subjects.length % SUBJECT_COLORS.length]

        const { data, error } = await supabase
          .from('subjects')
          .insert({ name: trimmed, color })
          .select('id,name,color')
          .single()

        if (error || !data) {
          alert(`과목을 추가하지 못했어요: ${error?.message ?? ''}`)
          return
        }
        set((s) => ({
          subjects: [...s.subjects, data as Subject],
          selectedSubjectId: s.selectedSubjectId ?? data.id,
        }))
      },

      removeSubject: async (id) => {
        if (get().status !== 'idle') return // 공부 중에는 삭제 불가
        const { error } = await supabase.from('subjects').delete().eq('id', id)
        if (error) {
          alert(`과목을 삭제하지 못했어요: ${error.message}`)
          return
        }
        set((s) => {
          const rest = s.subjects.filter((x) => x.id !== id)
          return {
            subjects: rest,
            selectedSubjectId:
              s.selectedSubjectId === id ? (rest[0]?.id ?? null) : s.selectedSubjectId,
          }
        })
      },

      selectSubject: (id) => {
        if (get().status !== 'idle') return // 공부 중에는 과목 변경 불가
        set({ selectedSubjectId: id })
      },

            updateSubjectColor: (id, color) => {
        set((s) => ({
          subjects: s.subjects.map((x) => (x.id === id ? { ...x, color } : x)),
          sessions: s.sessions.map((x) =>
            x.subjectId === id ? { ...x, subjectColor: color } : x
          ),
        }))
        saveSubjectColorLater(id, color)
      },

      // ---------- 타이머 ----------
      start: () => {
        const { status, selectedSubjectId, sessionStartedAt } = get()
        if (!selectedSubjectId || status === 'running') return
        const now = Date.now()
        set({
          status: 'running',
          runStartedAt: now,
          sessionStartedAt: sessionStartedAt ?? now,
        })
      },

      pause: () => {
        const s = get()
        if (s.status !== 'running') return
        set({
          status: 'paused',
          accumulatedMs: getElapsedMs(s),
          runStartedAt: null,
        })
      },

      // 초기화: 기록을 저장하지 않고 버림
      reset: () => set({ ...IDLE_TIMER }),

      // 종료: DB에 기록을 저장하고 대기 상태로. 저장에 실패하면 타이머를 유지함
      finish: async () => {
        const s = get()
        if (finishing) return
        if (s.status === 'idle' || s.sessionStartedAt === null) return

        const now = Date.now()
        const durationSeconds = Math.floor(getElapsedMs(s, now) / 1000)
        const subject = s.subjects.find((x) => x.id === s.selectedSubjectId)

        // 1초 미만이면 저장할 게 없으니 그냥 초기화
        if (durationSeconds < 1 || !subject) {
          set({ ...IDLE_TIMER })
          return
        }

        finishing = true
        try {
          const { data, error } = await supabase
            .from('study_sessions')
            .insert({
              subject_id: subject.id,
              subject_name: subject.name,
              subject_color: subject.color,
              study_date: format(new Date(s.sessionStartedAt), 'yyyy-MM-dd'),
              started_at: new Date(s.sessionStartedAt).toISOString(),
              ended_at: new Date(now).toISOString(),
              duration_seconds: durationSeconds,
              away_count: s.awayCount,
              away_seconds: s.awaySeconds,
            })
            .select('*')
            .single()

          if (error || !data) {
            alert(
              `기록을 저장하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요. (타이머는 그대로 유지돼요)\n${error?.message ?? ''}`
            )
            return
          }
          set({
            sessions: [...get().sessions, toSession(data as SessionRow)],
            ...IDLE_TIMER,
          })
        } finally {
          finishing = false
        }
      },

      // ---------- 설정 ----------
      updateSettings: (patch) => {
        const next = { ...get().settings, ...patch }
        next.graceSeconds = Math.min(300, Math.max(5, Math.round(next.graceSeconds)))
        set({ settings: next })
        saveSettingsLater(next)
      },

      resetSettings: () => {
        set({ settings: DEFAULT_SETTINGS })
        saveSettingsLater(DEFAULT_SETTINGS)
      },

      // ---------- 이탈 감지 ----------
      enterAway: (at) => {
        const s = get()
        if (s.status !== 'running' || s.awayStartedAt !== null) return

        if (s.settings.awayMode === 'record_only') {
          set({ awayStartedAt: at }) // 타이머는 그대로 진행
          return
        }

        set({
          status: s.settings.awayMode === 'away' ? 'away' : 'paused',
          accumulatedMs: getElapsedMs(s, at), // 이탈 확정 시점까지만 인정
          runStartedAt: null,
          awayStartedAt: at,
        })
      },

      returnFromAway: (now) => {
        const s = get()
        if (s.awayStartedAt === null) return
        const awaySec = Math.max(0, Math.floor((now - s.awayStartedAt) / 1000))
        const resume = s.status === 'away' // away 모드는 자동 재개
        set({
          awayStartedAt: null,
          awayCount: s.awayCount + 1,
          awaySeconds: s.awaySeconds + awaySec,
          ...(resume ? { status: 'running' as TimerStatus, runStartedAt: now } : {}),
        })
      },

      // ---------- 학습 도구 예외 ----------
      markToolOpened: () => set({ toolOpenUntil: Date.now() + TOOL_ALLOWANCE_MS }),
      clearToolFlag: () => set({ toolOpenUntil: null }),
    }),
    {
      name: 'study-timer-runtime', // 새 이름: 예전 localStorage 데이터는 무시됨
      // 지금 돌아가는 타이머 상태만 브라우저에 저장 (나머지는 DB)
      partialize: (s) => ({
        status: s.status,
        sessionStartedAt: s.sessionStartedAt,
        runStartedAt: s.runStartedAt,
        accumulatedMs: s.accumulatedMs,
        awayCount: s.awayCount,
        awaySeconds: s.awaySeconds,
        awayStartedAt: s.awayStartedAt,
        selectedSubjectId: s.selectedSubjectId,
      }),
    }
  )
)