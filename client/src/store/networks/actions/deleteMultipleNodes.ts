import { batch } from "react-redux"
import { AppThunk } from "../../store"
import { pushActionToUndoStack } from "../../ui/uiActions"
import {
  ICreatePersonStackAction,
  IStackAction,
  StackActionTypes,
} from "../../ui/uiTypes"
import { deletePerson } from "./deletePerson"
import { setNetworkLoading } from "./setNetworkLoading"

/**
 * @param networkId
 * @param nodeId
 * @param pinXY
 */
export const deleteMultipleNodes = (
  networkId: string,
  nodeIds: string[],
  doAddToUndoStack: boolean = true,
): AppThunk => {
  return async (dispatch, getState) => {
    dispatch(setNetworkLoading(true))

    try {
      const undoActions: IStackAction[] | null = doAddToUndoStack ? [] : null

      batch(() => {
        for (const nodeId of nodeIds) {
          if (doAddToUndoStack) {
            const person = getState().networks.currentNetwork?.people.find(
              (p) => p.id === nodeId,
            )
            if (!person) throw new Error("Node not found.")
            const undoAction: ICreatePersonStackAction = {
              type: StackActionTypes.CREATE,
              payload: person,
            }
            undoActions!.push(undoAction)
          }

          dispatch(deletePerson(networkId, nodeId, false))
        }
      })

      if (undoActions !== null && undoActions.length > 0) {
        dispatch(pushActionToUndoStack(undoActions))
      }

      dispatch(setNetworkLoading(false))
      return
    } catch (error) {
      dispatch(setNetworkLoading(false))
      throw error
    }
  }
}
