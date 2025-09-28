import { Container, Flex, Text, Box, Image, Button } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"
import { FiUsers, FiTrendingUp, FiClock } from "react-icons/fi"
import { useState } from "react"

export const Route = createFileRoute("/homepage")({
  component: Homepage,
})

function Homepage() {
  const [imageError, setImageError] = useState(false)

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
          Competition Hub
        </Text>
      </Flex>

      <Flex justify="center" minH="calc(100vh - 80px)" bg="gray.50" pt={8}>
        <Container maxW="6xl" p={6}>
          {/* Hero Section */}
          <Flex
            flexDir={{ base: "column", lg: "row" }}
            gap={8}
            align="center"
            mb={12}
          >
            {/* Content Section */}
            <Flex flex={1} flexDir="column" gap={6}>
              <Box>
                <Text
                  fontSize={{ base: "3xl", md: "4xl", lg: "5xl" }}
                  fontWeight="bold"
                  color="gray.800"
                  lineHeight="1.1"
                  mb={4}
                >
                  2024 National Business
                  <Text as="span" color="green.500">
                    {" "}Challenge
                  </Text>
                </Text>
                <Text
                  fontSize={{ base: "lg", md: "xl" }}
                  color="gray.600"
                  lineHeight="1.6"
                  mb={6}
                >
                  Join thousands of students nationwide in the ultimate business competition. 
                  Test your knowledge, compete with peers, and showcase your expertise with 
                  social intelligence, operations, and strategic thinking.
                </Text>
              </Box>

              {/* Competition Details */}
              <Flex
                flexDir={{ base: "column", md: "row" }}
                gap={4}
                p={6}
                bg="white"
                borderRadius="xl"
                boxShadow="md"
                border="1px"
                borderColor="gray.200"
              >
                <Flex align="center" gap={3} flex={1}>
                  <Box p={2} bg="green.100" borderRadius="full">
                    <FiUsers color="#38A169" />
                  </Box>
                  <Box>
                    <Text fontWeight="bold" color="gray.800">
                      500+ Participants
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      From 50+ Universities
                    </Text>
                  </Box>
                </Flex>

                <Flex align="center" gap={3} flex={1}>
                  <Box p={2} bg="blue.100" borderRadius="full">
                    <FiClock color="#3182CE" />
                  </Box>
                  <Box>
                    <Text fontWeight="bold" color="gray.800">
                      60 Minutes
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      Competition Duration
                    </Text>
                  </Box>
                </Flex>

                <Flex align="center" gap={3} flex={1}>
                  <Box p={2} bg="purple.100" borderRadius="full">
                    <FiTrendingUp color="#805AD5" />
                  </Box>
                  <Box>
                    <Text fontWeight="bold" color="gray.800">
                      $10,000
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      Prize Pool
                    </Text>
                  </Box>
                </Flex>
              </Flex>

              {/* Action Buttons */}
              <Flex gap={4} flexWrap="wrap">
                <Button
                  size="lg"
                  colorScheme="green"
                //   leftIcon={<FiPlay />}
                  px={8}
                  py={6}
                  fontSize="lg"
                  fontWeight="bold"
                  boxShadow="lg"
                  _hover={{ transform: "translateY(-2px)", boxShadow: "xl" }}
                  transition="all 0.2s"
                  onClick={() => window.location.href = '/signup'}
                >
                  Join Competition
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  colorScheme="green"
                  px={8}
                  py={6}
                  fontSize="lg"
                  fontWeight="bold"
                  _hover={{ bg: "green.50", transform: "translateY(-2px)" }}
                  transition="all 0.2s"
                  onClick={() => window.location.href = '/post-game-leaderboard'}
                >
                  View Leaderboard
                </Button>
              </Flex>
            </Flex>

            {/* Image Section */}
            <Flex flex={1} justify="center" align="center">
              <Box
                position="relative"
                maxW="500px"
                w="100%"
              >
                <Box
                  borderRadius="2xl"
                  overflow="hidden"
                  boxShadow="2xl"
                  border="4px"
                  borderColor="white"
                >
                  {!imageError ? (
                    <Image
                      src="/assets/images/competition-hero.jpg"
                      alt="Business Competition"
                      w="100%"
                      h="400px"
                      objectFit="cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <Flex
                      w="100%"
                      h="400px"
                      bg="green.500"
                      bgGradient="linear-gradient(135deg, #48BB78, #2F855A)"
                      align="center"
                      justify="center"
                      flexDir="column"
                      gap={4}
                    >
                      <Box
                        p={6}
                        bg="white"
                        borderRadius="full"
                        opacity={0.9}
                      >
                        <FiTrendingUp size={48} color="#38A169" />
                      </Box>
                      <Text
                        color="white"
                        fontSize="xl"
                        fontWeight="bold"
                        textAlign="center"
                      >
                        Business Excellence
                      </Text>
                      <Text
                        color="green.100"
                        fontSize="md"
                        textAlign="center"
                      >
                        Compete • Learn • Excel
                      </Text>
                    </Flex>
                  )}
                </Box>
                {/* Decorative Elements */}
                <Box
                  position="absolute"
                  top="-20px"
                  right="-20px"
                  w="40px"
                  h="40px"
                  bg="green.500"
                  borderRadius="full"
                  opacity={0.8}
                />
                <Box
                  position="absolute"
                  bottom="-15px"
                  left="-15px"
                  w="30px"
                  h="30px"
                  bg="blue.500"
                  borderRadius="full"
                  opacity={0.7}
                />
              </Box>
            </Flex>
          </Flex>

          {/* Description Section */}
          <Box
            bg="white"
            borderRadius="2xl"
            p={8}
            boxShadow="lg"
            border="1px"
            borderColor="gray.100"
          >
            <Text
              fontSize="2xl"
              fontWeight="bold"
              color="gray.800"
              mb={4}
              textAlign="center"
            >
              About the Competition
            </Text>
            <Text
              fontSize="lg"
              color="gray.600"
              lineHeight="1.8"
              textAlign="center"
              maxW="4xl"
              mx="auto"
            >
              The National Business Challenge is designed to test and celebrate the next 
              generation of business leaders. Participants will face real-world scenarios 
              covering financial analysis, market strategy, operational efficiency, and 
              leadership decision-making. Whether you're studying business, economics, or 
              any related field, this competition offers an opportunity to apply your 
              knowledge, learn from peers, and gain recognition for your expertise.
            </Text>
            
            <Flex
              mt={8}
              gap={8}
              justify="center"
              flexWrap="wrap"
            >
              <Box textAlign="center">
                <Text fontSize="3xl" fontWeight="bold" color="green.500">
                  4
                </Text>
                <Text color="gray.600" fontWeight="medium">
                  Categories
                </Text>
              </Box>
              <Box textAlign="center">
                <Text fontSize="3xl" fontWeight="bold" color="blue.500">
                  50+
                </Text>
                <Text color="gray.600" fontWeight="medium">
                  Questions
                </Text>
              </Box>
              <Box textAlign="center">
                <Text fontSize="3xl" fontWeight="bold" color="purple.500">
                  Real-time
                </Text>
                <Text color="gray.600" fontWeight="medium">
                  Scoring
                </Text>
              </Box>
            </Flex>
          </Box>
        </Container>
      </Flex>
    </>
  )
}

export default Homepage