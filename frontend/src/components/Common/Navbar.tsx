import { Flex, Image, useBreakpointValue } from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"

import Logo from "/assets/images/BusinessLogo.png"
import UserMenu from "./UserMenu"
import { Button } from "../ui/button"

function Navbar() {
  const display = useBreakpointValue({ base: "none", md: "flex" })

  return (
    <Flex
      display={display}
      justify="space-between"
      position="sticky"
      color="white"
      align="center"
      bg="bg.muted"
      w="100%"
      h="130px"
      top={0}
      px={7}
      py={2}
    >
      <Link to="/homepage">
        <Image src={Logo} alt="Logo" maxW="3xs" p={10} />
      </Link>
      <Flex gap={10} alignItems = "center">
        <Link to="/post-game-leaderboard">
          <Button>
            Leaderboard
          </Button>
        </Link>
        <UserMenu />
      </Flex>
    </Flex>
  )
}

export default Navbar
