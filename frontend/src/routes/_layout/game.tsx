import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Box, Container, Heading, VStack, Text } from "@chakra-ui/react"
import { useEffect, useState } from "react"
import { GameClient } from "../../components/Game/GameClient"
import { GlobalRecordButton } from "../../components/Common/GlobalRecordButton"

export const Route = createFileRoute("/_layout/game")({
  component: GamePage,
})

function GamePage() {
  const navigate = useNavigate()
  const [token, setToken] = useState<string | null>(null)
  const [gameEnded, setGameEnded] = useState(false)
  const [finalScores, setFinalScores] = useState<Record<string, number> | null>(
    null,
  )

  useEffect(() => {
    // Get JWT token from localStorage
    const accessToken = localStorage.getItem("access_token")
    if (!accessToken) {
      // Redirect to login if not authenticated
      navigate({ to: "/login" })
      return
    }
    setToken(accessToken)
  }, [navigate])

  const handleGameEnd = (scores: Record<string, number>) => {
    console.log("Game ended with scores:", scores)
    setFinalScores(scores)
    setGameEnded(true)

    // Optional: Navigate to results page after a delay
    setTimeout(() => {
      navigate({ to: "/" })
    }, 10000) // Return to dashboard after 10 seconds
  }

  if (!token) {
    return (
      <Container maxW="full" h="100vh">
        <VStack gap={4} align="center" justify="center" h="full">
          <Heading>Loading Game...</Heading>
        </VStack>
      </Container>
    )
  }

  if (gameEnded && finalScores) {
    return (
      <Container maxW="full" h="100vh">
        <VStack gap={4} align="center" justify="center" h="full">
          <Heading>Game Over!</Heading>
          <Text fontSize="lg">Final Scores:</Text>
          <Box>
            {Object.entries(finalScores).map(([playerId, score]) => (
              <Text key={playerId}>
                Player {playerId}: {score} points
              </Text>
            ))}
          </Box>
          <Text color="gray.500" fontSize="sm">
            Returning to dashboard in 10 seconds...
          </Text>
        </VStack>
      </Container>
    )
  }

  return (
    <Box w="100%" h="calc(100vh - 64px)" overflow="hidden">
      <Box position="absolute" top={4} right={4} zIndex={10}>
        <GlobalRecordButton />
      </Box>
      <GameClient
        token={token}
        serverUrl={import.meta.env.VITE_GAME_SERVER_URL || "http://localhost:3001"}
        onGameEnd={handleGameEnd}
      />
    </Box>
  )
}
