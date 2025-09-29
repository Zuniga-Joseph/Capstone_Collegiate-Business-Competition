// src/components/ui/TimerBadge.tsx
import { useEffect, useState } from "react"
import { Badge, HStack, IconButton, Tooltip } from "@chakra-ui/react"
import { MdPause, MdPlayArrow, MdRefresh } from "react-icons/md"

type Props = {
  durationMs: number
  onComplete?: () => void
}

const fmt = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = String(total % 60).padStart(2, "0")
  return `${m}:${s}`
}

export default function TimerBadge({ durationMs, onComplete }: Props) {
  const [remaining, setRemaining] = useState(durationMs)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    let id: ReturnType<typeof setInterval> | null = null
    if (running && remaining > 0) {
      id = setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1000) {
            if (id) clearInterval(id)
            onComplete?.()
            return 0
          }
          return prev - 1000
        })
      }, 1000)
    }
    return () => { if (id) clearInterval(id) }
  }, [running, remaining, onComplete])

  const reset = () => { setRemaining(durationMs); setRunning(false) }

  const color =
    remaining <= 15_000 ? "red" :
    remaining <= 60_000 ? "orange" : "green"

  return (
    <HStack gap={2}>
      <Badge colorScheme={color} fontSize="lg" aria-live="polite">
        {fmt(remaining)}
      </Badge>

      {/* Start/Pause */}
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <IconButton
            aria-label={running ? "Pause" : "Start"}
            onClick={() => setRunning(r => !r)}
            size="sm"
            variant="outline"
          >
            {running ? <MdPause /> : <MdPlayArrow />}
          </IconButton>
        </Tooltip.Trigger>
        <Tooltip.Positioner>
          <Tooltip.Content>
            <Tooltip.Arrow />
            {running ? "Pause" : "Start"}
          </Tooltip.Content>
        </Tooltip.Positioner>
      </Tooltip.Root>

      {/* Reset */}
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <IconButton aria-label="Reset" onClick={reset} size="sm" variant="outline">
            <MdRefresh />
          </IconButton>
        </Tooltip.Trigger>
        <Tooltip.Positioner>
          <Tooltip.Content>
            <Tooltip.Arrow />
            Reset
          </Tooltip.Content>
        </Tooltip.Positioner>
      </Tooltip.Root>
    </HStack>
  )
}
