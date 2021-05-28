import { batch } from "react-redux"
import { XYVals } from "../../../components/containers/ForceGraphCanvas/networkGraphTypes"
import { AppThunk } from "../../store"
import { setUILoading } from "../../ui/uiActions"
import { pinNode } from "./pinNode"
import { setNetworkLoading } from "./setNetworkLoading"

/**
 * Set a person's pin position for the Force Graph
 * @param networkId
 * @param nodeId
 * @param pinXY
 */
export const pinMultipleNodes = (
  networkId: string,
  nodes: { nodeId: string; isGroup: boolean; pinXY: XYVals }[],
): AppThunk => {
  return async (dispatch, getState) => {
    dispatch(setNetworkLoading(true))

    try {
      batch(() => {
        for (const { nodeId, isGroup, pinXY } of nodes) {
          dispatch(pinNode(networkId, nodeId, isGroup, pinXY))
        }
      })

      dispatch(setNetworkLoading(false))
      return
    } catch (error) {
      // Failed to set each person's pinXY state
      dispatch(setNetworkLoading(false))
      throw error
    }
  }
}
