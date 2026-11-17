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

// 특정 날짜의 과목별 공부 시간 (많은 순)
export function subjectStatsOfDate(sessions: StudySession[], date: string): SubjectStat[] {
  const map = new Map<string, SubjectStat>()
  for (const s of sessions) {
    if (s.studyDate !== date) continue
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