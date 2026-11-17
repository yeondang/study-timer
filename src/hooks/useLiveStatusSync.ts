import { useEffect } from 'react'
import { publishStatus } from '@/lib/liveStatus'
import { useProfileStore } from '@/store/useProfileStore'
import { useTimerStore } from '@/store/useTimerStore'

/** 내 타이머 상태가 바뀔 때마다 DB에 반영. Layout에서 한 번만 호출. */
export function useLiveStatusSync() {
  const loaded = useTimerStore((s) => s.loaded)
  const status = useTimerStore((s) => s.status)
  const runStartedAt = useTimerStore((s) => s.runStartedAt)
  const accumulatedMs = useTimerStore((s) => s.accumulatedMs)
  const awayStartedAt = useTimerStore((s) => s.awayStartedAt)
  const selectedSubjectId = useTimerStore((s) => s.selectedSubjectId)
  const sessions = useTimerStore((s) => s.sessions)

  const profileLoaded = useProfileStore((s) => s.loaded)
  const statusEmoji = useProfileStore((s) => s.statusEmoji)
  const statusText = useProfileStore((s) => s.statusText)

  // 상태가 바뀌면 0.5초 뒤 저장 (연달아 바뀌어도 한 번만)
  useEffect(() => {
    if (!loaded || !profileLoaded) return
    const id = window.setTimeout(publishStatus, 500)
    return () => window.clearTimeout(id)
  }, [
    loaded,
    profileLoaded,
    status,
    runStartedAt,
    accumulatedMs,
    awayStartedAt,
    selectedSubjectId,
    sessions,
    statusEmoji,
    statusText,
  ])

  // 공부 중에는 60초마다 "살아 있음" 신호
  useEffect(() => {
    if (!loaded) return
    const id = window.setInterval(() => {
      if (useTimerStore.getState().status !== 'idle') publishStatus()
    }, 60_000)
    return () => window.clearInterval(id)
  }, [loaded])
}