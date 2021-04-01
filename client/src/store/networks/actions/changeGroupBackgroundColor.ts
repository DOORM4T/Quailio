import { groupsCollection } from "../../../firebase/services"
import { AppThunk } from "../../store"
import {
  IChangeGroupBackgroundColorAction,
  NetworkActionTypes,
} from "../networkTypes"
import { setNetworkLoading } from "./setNetworkLoading"

export const changeGroupBackgroundColor = (
  groupId: string,
  networkId: string,
  newColor: string,
): AppThunk => async (dispatch, getState) => {
  dispatch(setNetworkLoading(true))

  try {
    // User is authenticated? Firestore operations.
    const isAuthenticated = Boolean(getState().auth.userId)
    if (isAuthenticated) {
      // Ensure the group document exists in the groups collection
      const groupDoc = await groupsCollection.doc(groupId).get()
      if (!groupDoc.exists) throw new Error("That group doesn't exist")

      // Update the group's backgroundColor field
      groupDoc.ref.update({ backgroundColor: newColor })
    }

    const action: IChangeGroupBackgroundColorAction = {
      type: NetworkActionTypes.CHANGE_GROUP_BACKGROUND_COLOR,
      groupId,
      networkId,
      newColor,
    }
    return dispatch(action)
  } catch (error) {
    dispatch(setNetworkLoading(false))
    throw error
  }
}
