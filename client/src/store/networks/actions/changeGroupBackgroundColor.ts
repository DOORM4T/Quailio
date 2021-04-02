import { groupsCollection } from "../../../firebase/services"
import { AppThunk } from "../../store"
import { IChangeGroupColorAction, NetworkActionTypes } from "../networkTypes"
import { setNetworkLoading } from "./setNetworkLoading"

export type GroupColorField = "backgroundColor" | "textColor"

export const changeGroupColor = (
  groupId: string,
  networkId: string,
  field: GroupColorField,
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

      // Update the group's backgroundColor or textColor field
      groupDoc.ref.update({ [field]: newColor })
    }

    const action: IChangeGroupColorAction = {
      type: NetworkActionTypes.CHANGE_GROUP_COLOR,
      groupId,
      networkId,
      field,
      newColor,
    }
    return dispatch(action)
  } catch (error) {
    dispatch(setNetworkLoading(false))
    throw error
  }
}
