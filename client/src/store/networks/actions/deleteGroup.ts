import firebase from "firebase"
import {
  groupsCollection,
  networksCollection,
} from "../../../firebase/services"
import { AppThunk } from "../../store"
import { IDeleteGroupAction, NetworkActionTypes } from "../networkTypes"
import { setNetworkLoading } from "./setNetworkLoading"

/**
 * Delete a group from a network
 * @param networkId
 * @param groupId
 * @returns
 */
export const deleteGroup = (
  networkId: string,
  groupId: string,
): AppThunk => async (dispatch, getState) => {
  dispatch(setNetworkLoading(true))
  try {
    const isAuthenticated = Boolean(getState().auth.userId)
    if (isAuthenticated) {
      // Ensure the network exists
      const networkDoc = await networksCollection.doc(networkId).get()
      if (!networkDoc.exists) throw new Error("That network doesn't exist")

      // Ensure the group exists
      const groupDoc = await groupsCollection.doc(groupId).get()
      if (!groupDoc.exists) throw new Error("That group doesn't exist")

      // Delete the group
      await groupDoc.ref.delete()

      // Remove the group from the current network's groupIds list
      const removeFromGroupIds: { groupIds: any } = {
        groupIds: firebase.firestore.FieldValue.arrayRemove(groupId),
      }
      await networkDoc.ref.update(removeFromGroupIds)
    }

    const action: IDeleteGroupAction = {
      type: NetworkActionTypes.DELETE_GROUP,
      networkId,
      groupId,
    }

    return dispatch(action)
  } catch (error) {
    dispatch(setNetworkLoading(false))
    throw error
  }
}
