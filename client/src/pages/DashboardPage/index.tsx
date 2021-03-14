import { Box } from "grommet"
import React from "react"
import { useSelector } from "react-redux"
import { HEADER_HEIGHT } from "../../components/containers/AppHeader"
import ForceGraphCanvas from "../../components/containers/ForceGraphCanvas/index"
import useAuth from "../../hooks/auth/useAuth"
import useGetNetworks from "../../hooks/networks/useGetNetworks"
import usePageExitConfirmation from "../../hooks/usePageExitConfirmation"
import useSmallBreakpoint from "../../hooks/useSmallBreakpoint"
import { getAllNetworkData } from "../../store/selectors/networks/getAllNetworkData"
import { getCurrentNetwork } from "../../store/selectors/networks/getCurrentNetwork"
import HeaderMenu from "./MenuHeader"
import PersonMenu from "./PersonMenu"

const DashboardPage: React.FC = () => {
  // Fetch network data (network IDs, network names, person IDs)
  useGetNetworks()

  // Ask the user to confirm when trying to navigate away from the page -- in case of unsaved changes
  usePageExitConfirmation()

  // Global state selectors
  const networks = useSelector(getAllNetworkData)
  const currentNetwork = useSelector(getCurrentNetwork)

  // Responsive breakpoint
  const isSmall = useSmallBreakpoint()

  // Check if the user is authenticated -- if not, use zero-login features
  const { isAuthenticated } = useAuth()

  // Variable for checking whether we're in zero-login mode or not
  const isZeroLoginMode = !isAuthenticated

  // List of people selected in the PersonMenu -- this list is used to perform operations on multiple people by their ID
  const [selected, setSelected] = React.useState<{ [key: string]: boolean }>({})

  return (
    <React.Fragment>
      <HeaderMenu
        networks={networks}
        currentNetwork={currentNetwork}
        isZeroLoginMode={isZeroLoginMode}
      />
      <Box
        direction={isSmall ? "column" : "row"}
        background="dark-1"
        style={{ height: `calc(100vh - ${HEADER_HEIGHT}px)` }}
        fill
      >
        {currentNetwork ? (
          <React.Fragment>
            {/* Network Actions & Details */}
            <Box
              direction="column"
              justify="start"
              align="stretch"
              width="large"
              height={isSmall ? "50%" : "100%"}
            >
              <PersonMenu
                id="person-menu"
                selected={selected}
                setSelected={setSelected}
                data={
                  currentNetwork
                    ? currentNetwork.people.sort((p1, p2) =>
                        p1.name.localeCompare(p2.name),
                      )
                    : []
                }
              />
            </Box>
            <ForceGraphCanvas
              id="network-sketch"
              currentNetwork={currentNetwork}
              style={{ overflow: "hidden", backgroundColor: "#DDD" }}
            />
          </React.Fragment>
        ) : (
          <Box margin={{ top: "xlarge", horizontal: "auto" }}>
            Create{isAuthenticated && ", select, "} or import a network!
          </Box>
        )}
      </Box>
    </React.Fragment>
  )
}

export default React.memo(DashboardPage)
