import { eachDayOfInterval, format } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { StudySession } from '@/types'

// 날짜별 총 공부 시간(초): { '2026-11-17': 3600, ... }
export function secondsByDate(sessions: StudySession[]): Record<string, number> {
  const result: Record<string, number> = {}
  for (const s of sessions) {
    result[s.studyDate] = (result[s.studyDate] ?? 0) + s.durationSeconds
  }
  return result
}

export interface SubjectStat {
  subjectId: string
  name: string
  color: string
  seconds: number
}

// 기간(start~end, 'yyyy-MM-dd' 포함)의 과목별 공부 시간 (많은 순)
export function subjectStatsOfRange(
  sessions: StudySession[],
  start: string,
  end: string
): SubjectStat[] {
  const map = new Map<string, SubjectStat>()
  for (const s of sessions) {
    if (s.studyDate < start || s.studyDate > end) continue
    const prev = map.get(s.subjectId)
    if (prev) prev.seconds += s.durationSeconds
    else
      map.set(s.subjectId, {
        subjectId: s.subjectId,
        name: s.subjectName,
        color: s.subjectColor,
        seconds: s.durationSeconds,
      })
  }
  return [...map.values()].sort((a, b) => b.seconds - a.seconds)
}

// 특정 하루의 과목별 공부 시간
export function subjectStatsOfDate(sessions: StudySession[], date: string): SubjectStat[] {
  return subjectStatsOfRange(sessions, date, date)
}

export interface DayPoint {
  date: string // 'yyyy-MM-dd'
  label: string // 그래프 가로축 글자
  total: number // 총 공부 시간(초)
  awayCount: number
  awaySeconds: number
  bySubject: Record<string, number> // 과목 id -> 초 (0인 과목은 없음)
}

// 기간의 하루하루 데이터 (기록이 없는 날도 0으로 포함)
export function buildDaily(
  sessions: StudySession[],
  start: Date,
  end: Date,
  labelFormat: string
): DayPoint[] {
  const startKey = format(start, 'yyyy-MM-dd')
  const endKey = format(end, 'yyyy-MM-dd')

  const byDate = new Map<string, StudySession[]>()
  for (const s of sessions) {
    if (s.studyDate < startKey || s.studyDate > endKey) continue
    const list = byDate.get(s.studyDate)
    if (list) list.push(s)
    else byDate.set(s.studyDate, [s])
  }

  return eachDayOfInterval({ start, end }).map((d) => {
    const key = format(d, 'yyyy-MM-dd')
    const bySubject: Record<string, number> = {}
    let total = 0
    let awayCount = 0
    let awaySeconds = 0
    for (const s of byDate.get(key) ?? []) {
      total += s.durationSeconds
      awayCount += s.awayCount
      awaySeconds += s.awaySeconds
      bySubject[s.subjectId] = (bySubject[s.subjectId] ?? 0) + s.durationSeconds
    }
    return {
      date: key,
      label: format(d, labelFormat, { locale: ko }),
      total,
      awayCount,
      awaySeconds,
      bySubject,
    }
  })
}

export interface RangeSummary {
  total: number
  studyDays: number // 공부 기록이 있는 날 수
  avgPerStudyDay: number
  best: DayPoint | null // 가장 많이 공부한 날
  awayCount: number
  awaySeconds: number
  awayPerHour: number // 공부 1시간당 이탈 횟수
  worstAwayDay: DayPoint | null // 이탈이 가장 많았던 날
}

export function summarize(days: DayPoint[]): RangeSummary {
  const total = days.reduce((sum, d) => sum + d.total, 0)
  const awayCount = days.reduce((sum, d) => sum + d.awayCount, 0)
  const awaySeconds = days.reduce((sum, d) => sum + d.awaySeconds, 0)
  const studied = days.filter((d) => d.total > 0)

  const best = studied.reduce<DayPoint | null>(
    (acc, d) => (acc === null || d.total > acc.total ? d : acc),
    null
  )
  const worstAwayDay = days.reduce<DayPoint | null>(
    (acc, d) => (d.awayCount > 0 && (acc === null || d.awayCount > acc.awayCount) ? d : acc),
    null
  )

  return {
    total,
    studyDays: studied.length,
    avgPerStudyDay: studied.length > 0 ? Math.round(total / studied.length) : 0,
    best,
    awayCount,
    awaySeconds,
    awayPerHour: total > 0 ? awayCount / (total / 3600) : 0,
    worstAwayDay,
  }
}

export interface SubjectAway {
  subjectId: string
  name: string
  color: string
  count: number
  seconds: number
}

// 과목별 이탈 (이탈 횟수 많은 순, 이탈 0인 과목 제외)
export function awayBySubject(
  sessions: StudySession[],
  start: string,
  end: string
): SubjectAway[] {
  const map = new Map<string, SubjectAway>()
  for (const s of sessions) {
    if (s.studyDate < start || s.studyDate > end) continue
    const prev = map.get(s.subjectId)
    if (prev) {
      prev.count += s.awayCount
      prev.seconds += s.awaySeconds
    } else {
      map.set(s.subjectId, {
        subjectId: s.subjectId,
        name: s.subjectName,
        color: s.subjectColor,
        count: s.awayCount,
        seconds: s.awaySeconds,
      })
    }
  }
  return [...map.values()].filter((x) => x.count > 0).sort((a, b) => b.count - a.count)
}