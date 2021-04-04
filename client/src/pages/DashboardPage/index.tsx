import { Box } from "grommet"
import React from "react"
import { useDispatch, useSelector } from "react-redux"
import { useHistory } from "react-router"
import { HEADER_HEIGHT } from "../../components/containers/AppHeader"
import ForceGraphCanvas from "../../components/containers/ForceGraphCanvas/index"
import useAuth from "../../hooks/auth/useAuth"
import useGetNetworks from "../../hooks/networks/useGetNetworks"
import usePageExitConfirmation from "../../hooks/usePageExitConfirmation"
import useSmallBreakpoint from "../../hooks/useSmallBreakpoint"
import {
  getAllNetworks,
  resetLocalNetworks,
  setNetwork,
} from "../../store/networks/actions"
import { ICurrentNetwork } from "../../store/networks/networkTypes"
import { getAllNetworkData } from "../../store/selectors/networks/getAllNetworkData"
import { getCurrentNetwork } from "../../store/selectors/networks/getCurrentNetwork"
import { getGroupIdsByPersonId } from "../../store/selectors/ui/getGroupIdsByPersonId"
import { getIsViewingShared } from "../../store/selectors/ui/getIsViewingShared"
import { getShowNodesWithoutGroups } from "../../store/selectors/ui/getShowNodesWithoutGroups"
import { setViewingShared } from "../../store/ui/uiActions"
import HeaderMenu from "./MenuHeader"
import PersonMenu from "./PersonMenu"

const DashboardPage: React.FC = () => {
  const dispatch = useDispatch()
  const history = useHistory()

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

  // Map of nodes and their groups
  const groupIdsByPersonId = useSelector(getGroupIdsByPersonId)

  // Global state to show/hide nodes without groups
  const doShowNodesWithoutGroups = useSelector(getShowNodesWithoutGroups)

  // REDUX SELECTOR | Viewing a shared network?
  const isViewingShared = useSelector(getIsViewingShared)

  React.useEffect(() => {
    async function viewSharedNetwork() {
      dispatch(setViewingShared(false))

      // Check if the page points to a shared network
      try {
        const sharedNetworkId = new URLSearchParams(window.location.search).get(
          "sharing",
        )

        if (sharedNetworkId) {
          await dispatch(setNetwork(sharedNetworkId, true))
          dispatch(setViewingShared(true))
        }
      } catch (error) {
        // Return to the plain dashboard if the shared network wasn't found
        console.error(error)
        history.push("/dashboard")
      }
    }

    viewSharedNetwork()
  }, [])

  React.useEffect(() => {
    return () => {
      // If viewing a shared network, clear it networks when the user navigates away from the dashboard
      if (isViewingShared) {
        dispatch(resetLocalNetworks())
      }
    }
  }, [])

  // Only show nodes that have at least one active group
  const networkWithActiveNodes: ICurrentNetwork | null = currentNetwork
    ? {
        ...currentNetwork,
        people: doShowNodesWithoutGroups
          ? currentNetwork.people // Show all people if showing nodes without groups
          : currentNetwork.people.filter((person) => {
              // Show just people with groups if NOT showing nodes without groups
              // Hide the node if none of its groups are active
              const groupIds = groupIdsByPersonId[person.id]
              const doHideNode = groupIds && groupIds.length === 0
              return !doHideNode
            }),
      }
    : null

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
                people={
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
              currentNetwork={networkWithActiveNodes}
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
