import { Box, FileInput, Text } from "grommet"
import React, { useEffect } from "react"
import { Helmet } from "react-helmet"
import { useDispatch, useSelector } from "react-redux"
import { Dispatch } from "redux"
import { HEADER_HEIGHT } from "../../components/containers/AppHeader"
import ForceGraphCanvas from "../../components/containers/ForceGraphCanvas/index"
import NetworkGraphToolbar from "../../components/containers/NetworkGraphToolbar"
import { importJSONAsNetwork } from "../../helpers/importJSONAsNetwork"
import { ICurrentNetwork } from "../../store/networks/networkTypes"
import { IApplicationState } from "../../store/store"
import { resetUI } from "../../store/ui/uiActions"
import useDashboard from "./logic/useDashboard"
import HeaderMenu from "./MenuHeader"
import PersonMenu from "./PersonMenu"

const DashboardPage: React.FC = () => {
  const dispatch: Dispatch<any> = useDispatch()
  const {
    currentNetwork,
    doShowPersonMenu,
    isSmall,
    isZeroLoginMode,
    isAuthenticated,
    isViewingShared,
    networks,
    setShowPersonMenu,
  } = useDashboard()

  // Reset certain UI state
  useEffect(() => {
    return () => {
      dispatch(resetUI())
    }
  }, [currentNetwork?.id])

  const visibleNodes = useSelector(
    (state: IApplicationState) => state.ui.personNodeVisibility,
  )

  const networkWithVisibleNodes: ICurrentNetwork | null = currentNetwork
    ? {
        ...currentNetwork,
        people: currentNetwork.people.filter(
          (p) => visibleNodes[p.id] !== false, // True and undefined mean the node is visible
        ),
      }
    : null // networkWithActiveNodes

  const HelmetTitle =
    isViewingShared && currentNetwork ? (
      <Helmet>
        <title>{currentNetwork.name} (Shared Network)</title>
        <meta
          name="description"
          content={`${currentNetwork.name} on Quailio`}
        />
      </Helmet>
    ) : (
      <Helmet>
        <title>Dashboard</title>
      </Helmet>
    )

  return (
    <React.Fragment>
      {HelmetTitle}

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
        overflow="hidden"
      >
        {currentNetwork ? (
          <React.Fragment>
            {doShowPersonMenu && (
              <PersonMenu currentNetwork={currentNetwork} isSmall={isSmall} />
            )}
            <ForceGraphCanvas
              id="network-sketch"
              currentNetwork={networkWithVisibleNodes}
              style={{ overflow: "hidden", backgroundColor: "#DDD" }}
            />
            <NetworkGraphToolbar isViewingShared={isViewingShared} />
          </React.Fragment>
        ) : (
          <Box margin={{ top: "xlarge", horizontal: "auto" }}>
            <Text textAlign="center" margin={{ bottom: "small" }}>
              Create{isAuthenticated && ", select, "} or import a network!
            </Text>
            <FileInput
              accept="application/json"
              onChange={(e) => {
                importJSONAsNetwork(e.target.files)
              }}
            />
          </Box>
        )}
      </Box>
    </React.Fragment>
  )
}

export default DashboardPage
