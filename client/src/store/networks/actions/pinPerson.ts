import firebase from "firebase"
import { groupsCollection, peopleCollection } from "../../../firebase/services"
import { AppThunk } from "../../store"
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
  isGroup: boolean,
  pinXY: { x: number; y: number } | undefined,
): AppThunk => {
  return async (dispatch, getState) => {
    dispatch(setNetworkLoading(true))

    try {
      // Firestore updates if the NOT is sharing mode and the user is authenticated
      const isSharing = getState().ui.isViewingShared // Viewers on a shared network should not be able to update the pinXY in Firestore
      const uid = getState().auth.userId
      if (!isSharing && uid) {
        const nodeDoc = isGroup
          ? await groupsCollection.doc(nodeId).get()
          : await peopleCollection.doc(nodeId).get()

        if (!nodeDoc) throw new Error("That node does not exist.")

        // Updates JUST the pinXY field on the document
        if (pinXY === undefined) {
          await nodeDoc.ref.update({
            pinXY: firebase.firestore.FieldValue.delete(),
          })
        } else {
          await nodeDoc.ref.update({ pinXY })
        }
      }

      /* Action to update state with the new person content */
      const action: ISetNodePinAction = {
        type: NetworkActionTypes.SET_NODE_PIN,
        networkId,
        nodeId,
        isGroup,
        pinXY,
      }

      return dispatch(action)
    } catch (error) {
      /* Failed to set the person's pinXY state*/
      dispatch(setNetworkLoading(false))
      throw error
    }
  }
}
