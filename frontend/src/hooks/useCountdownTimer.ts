import { useCallback, useEffect, useRef, useState } from "react"

export type UseCountdownOpts = {
  totalMs: number
  deadlineEpochMs?: number
  onExpire?: () => void
  tickMs?: number
  autoStart?: boolean
  pauseOnHidden?: boolean
}

export function useCountdownTimer({
  totalMs,
  deadlineEpochMs,
  onExpire,
  tickMs = 250,
  autoStart = true,
  pauseOnHidden = false,
}: UseCountdownOpts) {
  const [isRunning, setIsRunning] = useState(Boolean(autoStart))
  const [remainingMs, setRemainingMs] = useState(totalMs)
  const startPerfRef = useRef<number | null>(autoStart ? performance.now() : null)
  const carriedMsRef = useRef<number>(0)

  const computeRemaining = useCallback(() => {
    if (deadlineEpochMs) return Math.max(0, deadlineEpochMs - Date.now())
    const elapsed =
      carriedMsRef.current + (startPerfRef.current ? performance.now() - startPerfRef.current : 0)
    return Math.max(0, totalMs - elapsed)
  }, [deadlineEpochMs, totalMs])

  const tick = useCallback(() => {
    if (!isRunning) return
    const next = computeRemaining()
    setRemainingMs(next)
    if (next === 0) {
      setIsRunning(false)
      onExpire?.()
    }
  }, [computeRemaining, isRunning, onExpire])

  useEffect(() => {
    if (!isRunning) return
    tick()
    const id = setInterval(tick, tickMs)
    return () => clearInterval(id)
  }, [isRunning, tick, tickMs])

  useEffect(() => {
    if (!pauseOnHidden) return
    const onVis = () => {
      if (document.hidden && isRunning && !deadlineEpochMs) pause()
    }
    document.addEventListener("visibilitychange", onVis)
    return () => document.removeEventListener("visibilitychange", onVis)
  }, [pauseOnHidden, isRunning, deadlineEpochMs])

  const start = useCallback(() => {
    if (isRunning) return
    setIsRunning(true)
    if (!deadlineEpochMs) startPerfRef.current = performance.now()
  }, [isRunning, deadlineEpochMs])

  const pause = useCallback(() => {
    if (!isRunning) return
    setIsRunning(false)
    if (!deadlineEpochMs && startPerfRef.current != null) {
      carriedMsRef.current += performance.now() - startPerfRef.current
      startPerfRef.current = null
    }
  }, [isRunning, deadlineEpochMs])

  const reset = useCallback((newTotalMs?: number, newDeadlineMs?: number) => {
    setIsRunning(false)
    carriedMsRef.current = 0
    startPerfRef.current = null
    setRemainingMs(newTotalMs ?? totalMs)
    if (newDeadlineMs) setRemainingMs(Math.max(0, newDeadlineMs - Date.now()))
  }, [totalMs])

  return { remainingMs, isRunning, start, pause, reset }
}
