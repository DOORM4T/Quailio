import firebase from "firebase"
import { peopleCollection } from "../../../firebase/services"
import { AppThunk } from "../../store"
import { pushActionToUndoStack } from "../../ui/uiActions"
import { IPinPersonStackAction, StackActionTypes } from "../../ui/uiTypes"
import { ISetNodePinAction, NetworkActionTypes } from "../networkTypes"
import { setNetworkLoading } from "./setNetworkLoading"

/**
 * Set a person's pin position for the Force Graph
 * @param networkId
 * @param nodeId
 * @param pinXY
 */
export const pinNode = (
  networkId: string,
  nodeId: string, // Can refer to a person ID or group ID -- groups are represented as nodes in the Force Graph and can be pinned
  pinXY?: { x: number; y: number },
  doAddToUndoStack: boolean = true,
): AppThunk => {
  return async (dispatch, getState) => {
    dispatch(setNetworkLoading(true))

    try {
      // Firestore updates if NOT in sharing mode and the user is authenticated
      const isSharing = getState().ui.isViewingShared // Viewers on a shared network should not be able to update the pinXY in Firestore
      const uid = getState().auth.userId
      if (!isSharing && uid) {
        const nodeDoc = await peopleCollection.doc(nodeId).get()
        if (!nodeDoc) throw new Error("That node does not exist.")

        // Updates JUST the pinXY field on the document
        if (pinXY === undefined) {
          // Unpin the node -- remove their pinXY field
          await nodeDoc.ref.update({
            pinXY: firebase.firestore.FieldValue.delete(),
          })
        } else {
          await nodeDoc.ref.update({ pinXY })
        }
      }

      // #region Add to the UNDO stack
      // Undoing a CREATE action means we DELETE the person
      if (doAddToUndoStack) {
        const person = getState().networks.currentNetwork?.people.find(
          (p) => p.id === nodeId,
        )
        if (!person) throw new Error("Node not found.")
        const undoAction: IPinPersonStackAction = {
          type: StackActionTypes.PIN,
          payload: person,
        }
        dispatch(pushActionToUndoStack([undoAction]))
      }
      // //#endregion

      // Action to update state with the new person content
      const action: ISetNodePinAction = {
        type: NetworkActionTypes.SET_NODE_PIN,
        networkId,
        nodeId,
        pinXY,
      }

      return dispatch(action)
    } catch (error) {
      // Failed to set the person's pinXY state
      dispatch(setNetworkLoading(false))
      throw error
    }
  }
}
