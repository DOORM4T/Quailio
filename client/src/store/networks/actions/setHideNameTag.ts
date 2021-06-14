import { peopleCollection } from "../../../firebase/services"
import { AppThunk } from "../../store"
import { ISetHideNameTagAction, NetworkActionTypes } from "../networkTypes"
import { setNetworkLoading } from "./setNetworkLoading"

/**
 * Hide/Show the node's name tag in the Force Graph
 * @param networkId
 * @param nodeId
 * @param pinXY
 */
export const setHideNameTag = (
  nodeId: string, // Can refer to a person ID or group ID -- groups are represented as nodes in the Force Graph and can be pinned
  doHide: boolean,
): AppThunk => {
  return async (dispatch, getState) => {
    dispatch(setNetworkLoading(true))

    try {
      // Firestore updates if NOT in sharing mode and the user is authenticated
      const isSharing = getState().ui.isViewingShared // Viewers on a shared network should not be able to update the doHideNameTag field in Firestore
      const uid = getState().auth.userId
      if (!isSharing && uid) {
        const nodeDoc = await peopleCollection.doc(nodeId).get()
        if (!nodeDoc.exists) throw new Error("That node does not exist.")

        // Updates JUST the doHideNameTag field on the document
        await nodeDoc.ref.update({ doHideNameTag: doHide })
      }

      const action: ISetHideNameTagAction = {
        type: NetworkActionTypes.SET_HIDE_NAMETAG,
        nodeId,
        doHide,
      }

      return dispatch(action)
    } catch (error) {
      // Failed to set the person's doHideNameTag state
      dispatch(setNetworkLoading(false))
      throw error
    }
  }
}
