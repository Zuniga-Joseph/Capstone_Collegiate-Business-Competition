import { createFileRoute } from '@tanstack/react-router'
import TimerBadge from "@/components/ui/TimerBadge"

export const Route = createFileRoute('/timer')({
  component: TimerPage,
})

export default function TimerPage() {
  return (
    <div style={{ padding: "2rem" }}>
      <TimerBadge
        durationMs={600000} // 10 minutes
        onComplete={() => alert("Time is up!")}
      />
    </div>
  )
}


