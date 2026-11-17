import { useEffect, useRef } from 'react'
import { useTimerStore } from '@/store/useTimerStore'

/**
 * 탭 전환 / 창 최소화를 감지해서 이탈 처리를 하는 훅.
 * 앱 전체에서 한 번만 호출하면 됩니다 (Layout에서 호출).
 */
export function useAwayDetection() {
  const hiddenAtRef = useRef<number | null>(null) // 탭이 숨겨진 시각
  const delayMsRef = useRef(0) // 이번에 적용된 유예 시간
  const timerRef = useRef<number | null>(null) // 유예 타이머 id

  useEffect(() => {
    const clearGrace = () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }

    // 탭이 숨겨졌을 때
    const onHidden = () => {
      const s = useTimerStore.getState()
      if (s.status !== 'running') return // 공부 중일 때만 감지

      const now = Date.now()
      const baseMs = s.settings.graceSeconds * 1000

      // 학습 도구를 열었다면 유예를 "도구 허용 만료 시각"까지 늘려줌
      const toolActive = s.toolOpenUntil !== null && now < s.toolOpenUntil
      const delayMs = toolActive
        ? Math.max(baseMs, (s.toolOpenUntil as number) - now)
        : baseMs

      hiddenAtRef.current = now
      delayMsRef.current = delayMs

      clearGrace()
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null
        const hiddenAt = hiddenAtRef.current
        if (hiddenAt === null) return
        useTimerStore.getState().enterAway(hiddenAt + delayMsRef.current)
      }, delayMs)
    }

    // 탭이 다시 보일 때
    const onVisible = () => {
      const now = Date.now()
      const store = useTimerStore.getState()

      if (store.toolOpenUntil !== null) store.clearToolFlag()

      const hiddenAt = hiddenAtRef.current
      if (hiddenAt !== null) {
        // 유예 타이머가 아직 대기 중인 경우
        if (timerRef.current !== null) {
          clearGrace()
          // 절전 등으로 타이머가 늦게 울렸어도, 유예가 이미 지났다면 보정
          if (now - hiddenAt >= delayMsRef.current) {
            useTimerStore.getState().enterAway(hiddenAt + delayMsRef.current)
          }
        }
        hiddenAtRef.current = null
      }

      useTimerStore.getState().returnFromAway(now)
    }

    const onVisibilityChange = () => {
      if (document.hidden) onHidden()
      else onVisible()
    }

    // 새로고침 직후 이탈 상태가 남아 있으면 정리
    if (!document.hidden) {
      useTimerStore.getState().returnFromAway(Date.now())
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      clearGrace()
    }
  }, [])
}