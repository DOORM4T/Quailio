import { Box } from "grommet"
import React from "react"
import { useDispatch, useSelector } from "react-redux"
import { useHistory } from "react-router"
import { HEADER_HEIGHT } from "../../components/containers/AppHeader"
import ForceGraphCanvas from "../../components/containers/ForceGraphCanvas/index"
import { fireResizeEvent } from "../../helpers/fireResizeEvent"
import useAuth from "../../hooks/auth/useAuth"
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

  // STATE | Show/hide the Person Menu
  const [doShowPersonMenu, setShowPersonMenu] = React.useState(true)

  // EFFECT | Fire a resize event whenever doShowPersonMenu changes
  //        | This programmatically triggers the ForceGraphCanvas to resize when the PersonMenu opens or closes
  React.useEffect(() => {
    fireResizeEvent()
  }, [doShowPersonMenu]) // EFFECT | when doShowPersonMenu changes

  // EFFECT | On mount, check if viewing a shared network
  React.useEffect(() => {
    // Get query params from the URL
    const sharedNetworkId = new URLSearchParams(window.location.search).get(
      "sharing",
    )

    // Don't set the network to a shared network if there's no query param
    if (!sharedNetworkId) {
      dispatch(setViewingShared(false))
      return
    }

    // Set the shared network as the current network
    async function viewSharedNetwork(sharedId: string) {
      dispatch(setViewingShared(false))

      // Check if the page points to a shared network
      try {
        await dispatch(setNetwork(sharedId, true))
        dispatch(setViewingShared(true))
      } catch (error) {
        // Return to the plain dashboard if the shared network wasn't found
        console.error(error)
        history.push("/dashboard")
      }
    }

    viewSharedNetwork(sharedNetworkId)
  }, []) // END | Shared network effect

  // EFFECT | Get the logged-in user's networks
  React.useEffect(() => {
    // Clear previous networks
    dispatch(resetLocalNetworks())

    // Get networks when at /dashboard and when the user is authenticated
    if (history.location.pathname !== "/dashboard" || !isAuthenticated) return

    async function getNetworks() {
      try {
        await dispatch(getAllNetworks())
      } catch (error) {
        console.error(error)
      }
    }

    getNetworks()

    // UNMOUNT | Clean up the shared network, if the user was viewing one
    return () => {
      // If viewing a shared network, clear it networks when the user navigates away from the dashboard
      if (isViewingShared) {
        dispatch(resetLocalNetworks())
        dispatch(setViewingShared(false))
      }
    }
  }, [isAuthenticated]) // END | Get logged-in networks

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

  // Wrapper for a Person Menu. Hidden if doShowPersonMenu state is false
  const PersonMenuWrapper: React.ReactNode = doShowPersonMenu ? (
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
  ) : null

  return (
    <React.Fragment>
      <HeaderMenu
        networks={networks}
        currentNetwork={currentNetwork}
        isZeroLoginMode={isZeroLoginMode}
        doShowPersonMenu={doShowPersonMenu}
        setShowPersonMenu={setShowPersonMenu} // HeaderMenu includes a button that will toggle showPersonState
      />
      <Box
        direction={isSmall ? "column" : "row"}
        background="dark-1"
        style={{ height: `calc(100vh - ${HEADER_HEIGHT}px)` }}
        fill
      >
        {currentNetwork ? (
          <React.Fragment>
            {PersonMenuWrapper}
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
