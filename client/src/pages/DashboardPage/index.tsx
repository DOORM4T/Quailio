import { Box } from "grommet"
import React from "react"
import { useSelector } from "react-redux"
import { HEADER_HEIGHT } from "../../components/containers/AppHeader"
import ForceGraphCanvas from "../../components/containers/ForceGraphCanvas/index"
import PersonMenu from "../../components/containers/PersonMenu"
import ViewPersonOverlay from "../../components/containers/ViewPersonOverlay"
import useGetNetworks from "../../hooks/networks/useGetNetworks"
import useSmallBreakpoint from "../../hooks/useSmallBreakpoint"
import { getAllNetworkData } from "../../store/selectors/networks/getAllNetworkData"
import { getCurrentNetwork } from "../../store/selectors/networks/getCurrentNetwork"
import { getIsOverlayOpen } from "../../store/selectors/ui/getIsOverlayOpen"
import HeaderMenu from "./MenuHeader"

const DashboardPage: React.FC = () => {
  /* Access global state */
  /* Fetch network data (network IDs, network names, person IDs)*/
  useGetNetworks()
  const networks = useSelector(getAllNetworkData)
  const currentNetwork = useSelector(getCurrentNetwork)
  const isOverlayOpen = useSelector(getIsOverlayOpen)

  /* Responsive breakpoint */
  const isSmall = useSmallBreakpoint()

  return (
    <React.Fragment>
      <HeaderMenu networks={networks} currentNetwork={currentNetwork} />
      <Box
        direction={isSmall ? "column" : "row"}
        background="dark-1"
        style={{ height: `calc(100vh - ${HEADER_HEIGHT}px)` }}
        fill
      >
        {/* Network Actions & Details */}
        <Box direction="column" justify="start" align="stretch" width="large">
          {currentNetwork && (
            <PersonMenu
              id="person-menu"
              data={
                currentNetwork
                  ? currentNetwork.people.sort((p1, p2) =>
                      p1.name.localeCompare(p2.name),
                    )
                  : []
              }
            />
          )}
        </Box>
        <ForceGraphCanvas
          id="network-sketch"
          state={currentNetwork}
          style={{ overflow: "hidden", backgroundColor: "#DDD" }}
        />
      </Box>

      {/* -== VIEW PERSON OVERLAY ==- */}
      {isOverlayOpen && <ViewPersonOverlay id="view-person-overlay" />}
    </React.Fragment>
  )
}

export default DashboardPage
