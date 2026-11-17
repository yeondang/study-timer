import { useEffect, useState } from 'react'
import { getElapsedMs, useTimerStore } from '@/store/useTimerStore'

export function useElapsedSeconds(): number {
  const status = useTimerStore((s) => s.status)
  const runStartedAt = useTimerStore((s) => s.runStartedAt)
  const accumulatedMs = useTimerStore((s) => s.accumulatedMs)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    setNow(Date.now())
    if (status !== 'running') return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [status, runStartedAt])

  const ms = getElapsedMs({ status, runStartedAt, accumulatedMs }, now)
  return Math.max(0, Math.floor(ms / 1000))
}