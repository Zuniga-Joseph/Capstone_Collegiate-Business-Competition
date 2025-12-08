import { useEffect, useRef } from "react"
import { Application } from "pixi.js"
// @ts-ignore - JavaScript game client
import { Game } from "../../game-client/game.js"

interface GameClientProps {
  token: string
  serverUrl?: string
  onGameEnd?: (scores: Record<string, number>) => void
}

export function GameClient({ token, serverUrl, onGameEnd }: GameClientProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const gameRef = useRef<any>(null)

  useEffect(() => {
    let mounted = true

    const initGame = async () => {
      if (!containerRef.current || !mounted) return

      try {
        // Create Pixi application
        const app = new Application()
        await app.init({
          background: "#2c3e50",
          resizeTo: window,
        })

        // Add canvas to container
        if (containerRef.current && mounted) {
          containerRef.current.appendChild(app.canvas)
          appRef.current = app

          // Create and start game
          const game = new Game(app, token, serverUrl)
          gameRef.current = game

          // Listen for game end event
          if (onGameEnd && game.socket) {
            game.socket.on("gameEnd", (finalScores: Record<string, number>) => {
              onGameEnd(finalScores)
            })
          }

          await game.start()
        }
      } catch (error) {
        console.error("Failed to initialize game:", error)
      }
    }

    initGame()

    // Cleanup on unmount
    return () => {
      mounted = false
      if (gameRef.current?.socket) {
        gameRef.current.socket.disconnect()
      }
      if (appRef.current) {
        appRef.current.destroy(true, { children: true })
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = ""
      }
    }
  }, [token, serverUrl, onGameEnd])

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    />
  )
}
