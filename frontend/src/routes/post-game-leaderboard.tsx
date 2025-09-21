import { Container, Flex, Text, Box, Badge } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { FiUser, FiUsers, FiAward, FiClock, FiTarget } from "react-icons/fi"

export const Route = createFileRoute("/post-game-leaderboard")({
  component: Leaderboard,
})

// Mock data for individuals
const individualData = [
  { id: 1, name: "Sarah Johnson", points: 2450, timeMinutes: 42 },
  { id: 2, name: "Mike Chen", points: 2380, timeMinutes: 38 },
  { id: 3, name: "Emily Rodriguez", points: 2350, timeMinutes: 45 },
  { id: 4, name: "David Thompson", points: 2290, timeMinutes: 41 },
  { id: 5, name: "Jessica Park", points: 2240, timeMinutes: 47 },
  { id: 6, name: "Alex Kumar", points: 2190, timeMinutes: 44 },
  { id: 7, name: "Maria Garcia", points: 2150, timeMinutes: 49 },
  { id: 8, name: "James Wilson", points: 2100, timeMinutes: 43 },
]

// Mock data for schools
const schoolData = [
  { id: 1, name: "Baylor University", points: 18750, timeMinutes: 325 },
  { id: 2, name: "University of Texas", points: 17890, timeMinutes: 342 },
  { id: 3, name: "Texas A&M University", points: 17450, timeMinutes: 338 },
  { id: 4, name: "Rice University", points: 16980, timeMinutes: 356 },
  { id: 5, name: "Texas Tech University", points: 16720, timeMinutes: 361 },
  { id: 6, name: "University of Houston", points: 16450, timeMinutes: 368 },
  { id: 7, name: "SMU", points: 16200, timeMinutes: 375 },
  { id: 8, name: "TCU", points: 15980, timeMinutes: 382 },
]

function formatTime(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) {
    return `${hours}h ${mins}m`
  }
  return `${mins}m`
}

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <FiAward color="#FFD700" />
    case 2:
      return <FiAward color="#C0C0C0" />
    case 3:
      return <FiAward color="#CD7F32" />
    default:
      return <Box w="16px" h="16px" />
  }
}

interface LeaderboardItem {
  id: number
  name: string
  points: number
  timeMinutes: number
}

interface LeaderboardRowProps {
  item: LeaderboardItem
  rank: number
  isSchool?: boolean
}

function LeaderboardRow({ item, rank, isSchool = false }: LeaderboardRowProps) {
  return (
    <Flex
      p={4}
      bg="white"
      borderRadius="lg"
      boxShadow="sm"
      align="center"
      justify="space-between"
      border="1px"
      borderColor="gray.100"
      _hover={{ boxShadow: "md", borderColor: "green.200" }}
      transition="all 0.2s"
    >
      <Flex align="center" gap={4} flex={1}>
        <Flex align="center" gap={2} minW="60px">
          {getRankIcon(rank)}
          <Text fontWeight="bold" fontSize="lg" color="gray.700">
            #{rank}
          </Text>
        </Flex>
        <Flex align="center" gap={3}>
          <Box
            p={2}
            bg={isSchool ? "blue.100" : "green.100"}
            borderRadius="full"
          >
            {isSchool ? <FiUsers color="#3182CE" /> : <FiUser color="#38A169" />}
          </Box>
          <Text fontWeight="semibold" fontSize="md" color="gray.800">
            {item.name}
          </Text>
        </Flex>
      </Flex>

      <Flex gap={6} align="center">
        <Flex align="center" gap={2}>
          <FiTarget color="#38A169" />
          <Text fontWeight="bold" color="green.600">
            {item.points.toLocaleString()}
          </Text>
          <Text fontSize="sm" color="gray.500">
            pts
          </Text>
        </Flex>
        <Flex align="center" gap={2}>
          <FiClock color="#718096" />
          <Text fontWeight="medium" color="gray.600">
            {formatTime(item.timeMinutes)}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  )
}

function Leaderboard() {
  const [activeTab, setActiveTab] = useState("individuals")

  const currentData = activeTab === "individuals" ? individualData : schoolData
  const isSchoolTab = activeTab === "schools"

  return (
    <>
      {/* Green Gradient Header */}
      <Flex
        bg="green.500"
        bgGradient="linear-gradient(to right, #48BB78, #2F855A)"
        h="80px"
        align="center"
        justify="center"
        w="100%"
        boxShadow="md"
      >
        <Text color="white" fontSize="2xl" fontWeight="bold" textAlign="center">
          Leaderboard
        </Text>
      </Flex>

      <Flex justify="center" minH="calc(100vh - 80px)" bg="gray.50" pt={6}>
        <Container maxW="4xl" p={6}>
          {/* Tab Navigation */}
          <Flex
            bg="white"
            borderRadius="xl"
            p={2}
            mb={6}
            boxShadow="sm"
            border="1px"
            borderColor="gray.200"
          >
            <Flex
              flex={1}
              justify="center"
              align="center"
              gap={2}
              p={3}
              cursor="pointer"
              borderRadius="lg"
              bg={activeTab === "individuals" ? "green.500" : "transparent"}
              color={activeTab === "individuals" ? "white" : "gray.600"}
              fontWeight={activeTab === "individuals" ? "bold" : "medium"}
              transition="all 0.2s"
              onClick={() => setActiveTab("individuals")}
              _hover={{
                bg: activeTab === "individuals" ? "green.600" : "gray.100",
              }}
            >
              <FiUser />
              <Text>Individuals</Text>
              <Badge
                colorScheme={activeTab === "individuals" ? "green" : "gray"}
                variant={activeTab === "individuals" ? "solid" : "subtle"}
              >
                {individualData.length}
              </Badge>
            </Flex>
            <Flex
              flex={1}
              justify="center"
              align="center"
              gap={2}
              p={3}
              cursor="pointer"
              borderRadius="lg"
              bg={activeTab === "schools" ? "green.500" : "transparent"}
              color={activeTab === "schools" ? "white" : "gray.600"}
              fontWeight={activeTab === "schools" ? "bold" : "medium"}
              transition="all 0.2s"
              onClick={() => setActiveTab("schools")}
              _hover={{
                bg: activeTab === "schools" ? "green.600" : "gray.100",
              }}
            >
              <FiUsers />
              <Text>Schools</Text>
              <Badge
                colorScheme={activeTab === "schools" ? "green" : "gray"}
                variant={activeTab === "schools" ? "solid" : "subtle"}
              >
                {schoolData.length}
              </Badge>
            </Flex>
          </Flex>

          {/* Leaderboard Header */}
          <Flex
            justify="space-between"
            align="center"
            mb={4}
            px={4}
            py={2}
          >
            <Text fontSize="lg" fontWeight="bold" color="gray.700">
              {isSchoolTab ? "School Rankings" : "Individual Rankings"}
            </Text>
            <Text fontSize="sm" color="gray.500">
              Last updated: Just now
            </Text>
          </Flex>

          {/* Leaderboard List */}
          <Flex flexDir="column" gap={3}>
            {currentData.map((item, index) => (
              <LeaderboardRow
                key={item.id}
                item={item}
                rank={index + 1}
                isSchool={isSchoolTab}
              />
            ))}
          </Flex>
        </Container>
      </Flex>
    </>
  )
}

export default Leaderboard