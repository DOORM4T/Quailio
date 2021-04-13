import React from "react"
import { useDispatch, useSelector } from "react-redux"
import { useHistory } from "react-router-dom"
import { fireResizeEvent } from "../../../helpers/fireResizeEvent"
import useAuth from "../../../hooks/auth/useAuth"
import usePageExitConfirmation from "../../../hooks/usePageExitConfirmation"
import useSmallBreakpoint from "../../../hooks/useSmallBreakpoint"
import {
  getAllNetworks,
  resetLocalNetworks,
  setNetwork,
} from "../../../store/networks/actions"
import { getAllNetworkData } from "../../../store/selectors/networks/getAllNetworkData"
import { getCurrentNetwork } from "../../../store/selectors/networks/getCurrentNetwork"
import { getGroupIdsByPersonId } from "../../../store/selectors/ui/getGroupIdsByPersonId"
import { getIsViewingShared } from "../../../store/selectors/ui/getIsViewingShared"
import { getShowNodesWithoutGroups } from "../../../store/selectors/ui/getShowNodesWithoutGroups"
import { setViewingShared } from "../../../store/ui/uiActions"

export default function useDashboard() {
  // REDUX DISPATCH | For dispatching custom Redux actions
  const dispatch = useDispatch()

  // HISTORY | For redirecting to differnt paths
  const history = useHistory()

  // Responsive breakpoint
  const isSmall = useSmallBreakpoint()

  // Check if the user is authenticated -- if not, use zero-login features
  const { isAuthenticated } = useAuth()

  // Variable for checking whether we're in zero-login mode or not
  const isZeroLoginMode = !isAuthenticated

  // REDUX SELECTORS | Global state selectors
  const networks = useSelector(getAllNetworkData)
  const currentNetwork = useSelector(getCurrentNetwork)
  const groupIdsByPersonId = useSelector(getGroupIdsByPersonId) // Map of nodes and their groups
  const doShowNodesWithoutGroups = useSelector(getShowNodesWithoutGroups) // Global state to show/hide nodes without groups
  const isViewingShared = useSelector(getIsViewingShared) // Viewing a shared network?

  // Ask the user to confirm when trying to navigate away from the page -- in case of unsaved changes
  usePageExitConfirmation(isViewingShared) // Doesn't set an "unsaved change" confirmation when viewing a shared network

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

    // FUNCTION | Set the shared network as the current network
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
    } // END | viewSharedNetwork

    viewSharedNetwork(sharedNetworkId)
  }, []) // END | Shared network effect

  // EFFECT | Get the logged-in user's networks
  React.useEffect(() => {
    // Clear previous networks
    dispatch(resetLocalNetworks())

    // Get networks when at /dashboard and when the user is authenticated
    if (history.location.pathname !== "/dashboard" || !isAuthenticated) return

    // FUNCTION | Put the user's networks in global state
    async function getNetworks() {
      try {
        await dispatch(getAllNetworks())
      } catch (error) {
        console.error(error)
      }
    } // END | getNetworks

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

  // RETURN | All the hook values that will be used by the Dashboard page
  return {
    currentNetwork,
    doShowNodesWithoutGroups,
    doShowPersonMenu,
    groupIdsByPersonId,
    isSmall,
    isZeroLoginMode,
    isAuthenticated,
    isViewingShared,
    networks,
    setShowPersonMenu,
  }
}
