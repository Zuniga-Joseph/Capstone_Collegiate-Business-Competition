import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/sentiment_analysis_dash')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/sentiment_analysis_dash"!</div>
}
