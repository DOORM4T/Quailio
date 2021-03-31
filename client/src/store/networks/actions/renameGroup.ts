import { groupsCollection } from "../../../firebase/services"
import { AppThunk } from "../../store"
import { IRenameGroupAction, NetworkActionTypes } from "../networkTypes"
import { setNetworkLoading } from "./setNetworkLoading"

export const renameGroup = (
  networkId: string,
  groupId: string,
  newName: string,
): AppThunk => async (dispatch, getState) => {
  dispatch(setNetworkLoading(true))

  try {
    // User is authenticated? Firestore operations.
    const isAuthenticated = Boolean(getState().auth.userId)
    if (isAuthenticated) {
      // Ensure the group document exists in the groups collection
      const groupDoc = await groupsCollection.doc(groupId).get()
      if (!groupDoc.exists) throw new Error("That group doesn't exist")

      // Update the group's name field
      groupDoc.ref.update({ name: newName })
    }

    const action: IRenameGroupAction = {
      type: NetworkActionTypes.RENAME_GROUP,
      groupId,
      networkId,
      newName,
    }

    return dispatch(action)
  } catch (error) {
    dispatch(setNetworkLoading(false))
    throw error
  }
}
