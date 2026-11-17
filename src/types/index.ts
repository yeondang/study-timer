export type AwayMode = 'pause' | 'away' | 'record_only'

// idle: 대기 / running: 공부 중 / paused: 일시정지 / away: 자리 비움
export type TimerStatus = 'idle' | 'running' | 'paused' | 'away'

export interface Subject {
  id: string
  name: string
  color: string
}

export interface StudySession {
  id: string
  subjectId: string
  subjectName: string // 과목이 나중에 삭제돼도 통계에 이름이 남도록 같이 저장
  subjectColor: string
  studyDate: string // 'yyyy-MM-dd'
  startedAt: number // 시작 시각 (ms)
  endedAt: number
  durationSeconds: number
  awayCount: number
  awaySeconds: number
}

export interface Settings {
  awayMode: AwayMode
  graceSeconds: number
}

export interface Todo {
  id: string
  subjectId: string | null // 과목 연결 (선택)
  title: string
  todoDate: string // 'yyyy-MM-dd'
  isDone: boolean
}

export interface SubjectGoal {
  subjectId: string
  goalDate: string // 'yyyy-MM-dd'
  goalMinutes: number
}

export interface Group {
  id: string
  name: string
  inviteCode: string
  ownerId: string
}

export type LiveState = 'studying' | 'resting' | 'away' | 'offline'

export interface LiveStatus {
  userId: string
  status: LiveState
  subjectName: string | null
  currentStartedAt: number | null // 지금 달리는 구간의 시작 시각 (ms)
  todaySeconds: number // 오늘 누적 (지금 달리는 구간 제외)
  updatedAt: number
}

export interface GroupMember {
  userId: string
  nickname: string
  isOwner: boolean
}