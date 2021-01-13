import {
  Box,
  Button,
  DropButton,
  Heading,
  List,
  ResponsiveContext,
} from "grommet"
import React from "react"
import { useDispatch, useSelector } from "react-redux"
import { ActionCreator, AnyAction } from "redux"
import ForceGraphCanvas from "../components/containers/ForceGraphCanvas"
import Header, { HEADER_HEIGHT } from "../components/Header"
import useAuthRedirect from "../hooks/auth/useAuthRedirect"
import useGetNetworks from "../hooks/networks/useGetNetworks"
import {
  addPerson,
  createNetwork,
  deleteNetwork,
  setNetwork,
  setNetworkLoading,
} from "../store/networks/networksActions"
import { INetwork } from "../store/networks/networkTypes"
import { IApplicationState } from "../store/store"

const DashboardPage: React.FC<IProps> = (props: IProps) => {
  /* redirect to login page if not authenticated */
  useAuthRedirect({ whenAuth: false, destination: "/login" })

  /* get all network data for an authenticated user */
  const { didGetNetworks } = useGetNetworks()

  const dispatch: ActionCreator<AnyAction> = useDispatch()
  const networks = useSelector<IApplicationState, INetwork[]>(
    (state) => state.networks.networks,
  )
  const currentNetwork = useSelector<IApplicationState, INetwork | null>(
    (state) => state.networks.currentNetwork,
  )

  /* responsive breakpoints */
  const size = React.useContext(ResponsiveContext)
  const isSmall = size === "xsmall" || size === "small"

  /* Create Network Function */
  const handleCreateNetwork = async () => {
    const networkName = window.prompt("Name your network:")
    if (!networkName) {
      alert("Canceled network creation")
      return
    }
    const doesNetworkExist = networks.some((n) => n.name === networkName)
    if (doesNetworkExist) {
      alert("[NOT CREATED] That network already exists.")
      return
    }

    try {
      await dispatch(createNetwork(networkName))
    } catch (error) {
      await dispatch(setNetworkLoading(false))
      console.error(error)
    }
  }

  /* Select Network Function */
  const handleNetworkSelect = (id: string) => {
    return async () => {
      try {
        await dispatch(setNetwork(id))
      } catch (error) {
        await dispatch(setNetworkLoading(false))
        console.error(error)
      }
    }
  }

  /* Add Person Function */
  const addPersonHandler = async () => {
    if (!currentNetwork) {
      alert("Please select a Network!")
      return
    }

    /* get name of person to add */
    const name = window.prompt("Name of person:")
    if (!name) {
      alert("Canceled add person action")
      return
    }

    /* update state */
    try {
      await dispatch(addPerson(currentNetwork.id, name))
    } catch (error) {
      await dispatch(setNetworkLoading(false))
      console.error(error)
    }
  }

  const handleDeleteNetwork = async () => {
    if (!currentNetwork) return

    /* confirm deletion */
    const doDelete = window.confirm(`Delete network: ${currentNetwork.name}?`)
    if (!doDelete) {
      alert(`Did not delete ${currentNetwork.name}`)
      return
    }

    /* update state */
    try {
      await dispatch(deleteNetwork(currentNetwork.id))
    } catch (error) {
      await dispatch(setNetworkLoading(false))
      console.error(error)
    }
  }

  /* Menu component of the user's Networks for the Select Network dropdown */
  const NetworkMenu = () => {
    if (!networks || networks.length === 0) return <Box />

    return (
      <Box direction="column">
        {networks.map((n, index) => {
          return (
            <Box key={`${n.id}-${index}`} onClick={handleNetworkSelect(n.id)}>
              {n.name}
            </Box>
          )
        })}
      </Box>
    )
  }

  return (
    <React.Fragment>
      <Header title="Dashboard" />
      <Box
        direction={isSmall ? "column" : "row"}
        flex={{ grow: 1 }}
        style={{ height: `calc(100vh - ${HEADER_HEIGHT}px)` }}
        background="light-1"
      >
        <Box
          direction="column"
          width={{ min: "360px" }}
          pad={{ horizontal: "large", bottom: "large" }}
          background="light-1"
          overflow={{ vertical: "auto" }}
        >
          <Box pad="small" gap="large">
            <Button label="New Network" onClick={handleCreateNetwork} />
            <DropButton
              label={
                (currentNetwork && currentNetwork.name) || "Select Network"
              }
              dropAlign={{ top: "bottom" }}
              dropContent={NetworkMenu()}
              disabled={networks.length === 0}
            />
            <Button
              label="Delete Network"
              onClick={handleDeleteNetwork}
              disabled={!currentNetwork}
            />
          </Box>
          <Box pad={{ top: "large" }}>
            <Heading level={3}>Network</Heading>
            <Button
              label="Add Person"
              onClick={addPersonHandler}
              disabled={!currentNetwork}
            />
            <List
              data={
                currentNetwork ? currentNetwork.people.map((p) => p.name) : []
              }
              margin={{ bottom: "medium" }}
            />
          </Box>
        </Box>
        <ForceGraphCanvas
          id="network-sketch"
          state={currentNetwork}
          style={{ overflow: "hidden", backgroundColor: "#DDD" }}
        />
      </Box>
    </React.Fragment>
  )
}

export default DashboardPage

interface IProps {}
