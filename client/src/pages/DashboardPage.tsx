import React from "react"
import {
  Box,
  Button,
  DropButton,
  Heading,
  List,
  Text,
  ResponsiveContext,
} from "grommet"

import Header, { HEADER_HEIGHT } from "../components/Header"

import ForceGraphCanvas from "../components/containers/ForceGraphCanvas"
import { INetwork, INetworksState } from "../store/networks/networkTypes"
import { auth } from "../firebase"
import { useHistory } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { ActionCreator, AnyAction } from "redux"
import {
  addPerson,
  createNetwork,
  getAllNetworks,
  setNetwork,
  setNetworkLoading,
} from "../store/networks/networksActions"
import { IApplicationState } from "../store/store"
import { setUser } from "../store/auth/authActions"

const DashboardPage: React.FC<IProps> = (props: IProps) => {
  const dispatch: ActionCreator<AnyAction> = useDispatch()
  const networks =
    useSelector<IApplicationState, INetwork[]>(
      (state) => state.networks.networks,
    ) || []

  const currentNetwork = useSelector<IApplicationState, INetwork | null>(
    (state) => state.networks.currentNetwork,
  )

  const size = React.useContext(ResponsiveContext)
  const isSmall = size === "xsmall" || size === "small"

  const history = useHistory()

  React.useEffect(() => {
    /* redirect to sign in if the user is not authenticated in */
    auth.onAuthStateChanged(async (user) => {
      if (!user) history.push("/login")

      try {
        dispatch(setUser(user!.uid))
        await dispatch(getAllNetworks())
      } catch (error) {
        await dispatch(setNetworkLoading(false))
        console.error(error)
      }
    })
  }, [])

  // TODO: get networks based on UID
  const handleCreateNetwork = async () => {
    const networkName = prompt("Name your network:")
    if (!networkName) return
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

  const addPersonHandler = async () => {
    if (!currentNetwork) {
      alert("Please select a Network!")
      return
    }

    const name = prompt("Name of person:")
    if (!name) return

    await dispatch(addPerson(currentNetwork.id, name))
  }

  /* Menu of the user's Networks for the Select Network dropdown */
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
