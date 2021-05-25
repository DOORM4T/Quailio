import React from "react"
import { useDispatch, useSelector } from "react-redux"
import { useHistory } from "react-router-dom"
import { fireResizeEvent } from "../../../helpers/customEvents"
import useAuth from "../../../hooks/auth/useAuth"
import usePageExitConfirmation from "../../../hooks/usePageExitConfirmation"
import useSmallBreakpoint from "../../../hooks/useSmallBreakpoint"
import { routeNames } from "../../../Routes"
import {
  getAllNetworks,
  resetLocalNetworks,
  setNetwork,
} from "../../../store/networks/actions"
import { IPerson } from "../../../store/networks/networkTypes"
import { getAllNetworkData } from "../../../store/selectors/networks/getAllNetworkData"
import { getCurrentNetwork } from "../../../store/selectors/networks/getCurrentNetwork"
import { getIsViewingShared } from "../../../store/selectors/ui/getIsViewingShared"
import { getNodeVisibilityMap } from "../../../store/selectors/ui/getPersonNodeVisibility"
import {
  cachePersonGroupList,
  setViewingShared,
  togglePersonOverlay,
  toggleShareOverlay,
} from "../../../store/ui/uiActions"
import { IPersonIDWithActiveGroups } from "../../../store/ui/uiTypes"

export default function useDashboard() {
  const dispatch = useDispatch()
  const history = useHistory()
  const isSmall = useSmallBreakpoint()

  const networks = useSelector(getAllNetworkData)
  const currentNetwork = useSelector(getCurrentNetwork)
  const isViewingShared = useSelector(getIsViewingShared)
  const nodeVisibilityMap = useSelector(getNodeVisibilityMap)

  // Check if the user is authenticated -- if not, use zero-login features
  const { isAuthenticated } = useAuth()
  const isZeroLoginMode = !isAuthenticated

  // Ask the user to confirm when trying to navigate away from the page -- in case of unsaved changes
  usePageExitConfirmation(isViewingShared) // Doesn't set an "unsaved change" confirmation when viewing a shared network

  // STATE | Show/hide the Person Menu
  const [doShowPersonMenu, setShowPersonMenu] = React.useState(true)

  // EFFECT | Programmatically triggers the ForceGraphCanvas to resize when the PersonMenu opens or closes
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
        history.push(routeNames.DASHBOARD)
      }
    } // END | viewSharedNetwork

    viewSharedNetwork(sharedNetworkId)
  }, []) // END | Shared network effect

  // EFFECT | Get the logged-in user's networks
  React.useEffect(() => {
    // Clear previous networks
    dispatch(resetLocalNetworks())

    // Get networks when at /dashboard and when the user is authenticated
    if (
      history.location.pathname !== routeNames.DASHBOARD.valueOf() ||
      !isAuthenticated
    )
      return

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

  // EFFECT | Hide all modals by default
  React.useEffect(() => {
    dispatch(togglePersonOverlay(false))
    dispatch(toggleShareOverlay(false))
  }, [])

  /* EFFECT | Cache global "groupsByPersonIds" state for people and the active/visible groups they're in 
            |    The "groupsByPersonIds" global state is used by the force-graph 
            |    -- setting/caching the state from this PersonMenu component saves a lot of
            |    processing that would otherwise be inefficiently calculated during each tick of the force-graph  */
  React.useEffect(() => {
    // Stop if there aren't any groups in the current network -- this means there's no person-group data to cache
    if (!currentNetwork || !currentNetwork.people.some((p) => p.isGroup)) return
    const groups = currentNetwork.people.filter((p) => p.isGroup)

    const groupsByPersonIds = currentNetwork.people.map((p) => {
      const isPersonInGroup = (group: IPerson) =>
        group.relationships[p.id] !== undefined
      const groupsWithPerson = groups.filter(isPersonInGroup)

      const isGroupVisible = (group: IPerson) =>
        nodeVisibilityMap[group.id] !== false
      const activeGroupIds = groupsWithPerson
        .filter(isGroupVisible)
        .map((g) => g.id)

      const data: IPersonIDWithActiveGroups = {
        personId: p.id,
        activeGroupIds,
      }
      return data
    })

    // Cache in global state
    dispatch(cachePersonGroupList(groupsByPersonIds))
  }, [currentNetwork?.people]) // Cache groups by person ID

  // RETURN | All the hook values that will be used by the Dashboard page
  return {
    currentNetwork,
    doShowPersonMenu,
    isSmall,
    isZeroLoginMode,
    isAuthenticated,
    isViewingShared,
    networks,
    setShowPersonMenu,
  }
}
