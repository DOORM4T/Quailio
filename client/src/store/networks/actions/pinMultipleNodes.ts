import { batch } from "react-redux"
import { XYVals } from "../../../components/containers/ForceGraphCanvas/networkGraphTypes"
import { AppThunk } from "../../store"
import { pushActionToUndoStack } from "../../ui/uiActions"
import {
  IPinPersonStackAction,
  IStackAction,
  StackActionTypes,
} from "../../ui/uiTypes"
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
  nodes: { nodeId: string; pinXY: XYVals }[],
  doAddToUndoStack: boolean = true,
): AppThunk => {
  return async (dispatch, getState) => {
    dispatch(setNetworkLoading(true))

    try {
      const undoActions: IStackAction[] | null = doAddToUndoStack ? [] : null

      batch(() => {
        for (const { nodeId, pinXY } of nodes) {
          if (doAddToUndoStack) {
            const person = getState().networks.currentNetwork?.people.find(
              (p) => p.id === nodeId,
            )
            if (!person) throw new Error("Node not found.")
            const undoAction: IPinPersonStackAction = {
              type: StackActionTypes.PIN,
              payload: person,
            }
            undoActions!.push(undoAction)
          }

          dispatch(pinNode(networkId, nodeId, pinXY, false))
        }
      })

      if (undoActions !== null && undoActions.length > 0) {
        dispatch(pushActionToUndoStack(undoActions))
      }

      dispatch(setNetworkLoading(false))
      return
    } catch (error) {
      // Failed to set each person's pinXY state
      dispatch(setNetworkLoading(false))
      throw error
    }
  }
}
