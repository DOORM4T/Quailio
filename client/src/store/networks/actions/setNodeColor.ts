import { groupsCollection } from "../../../firebase/services"
import { AppThunk } from "../../store"
import { ISetNodeColor, NetworkActionTypes } from "../networkTypes"
import { setNetworkLoading } from "./setNetworkLoading"

export type GroupColorField = "backgroundColor" | "textColor"

export const setNodeColor =
  (
    networkId: string,
    personId: string,
    field: GroupColorField,
    newColor: string,
  ): AppThunk =>
  async (dispatch, getState) => {
    dispatch(setNetworkLoading(true))

    try {
      // User is authenticated? Firestore operations.
      const isAuthenticated = Boolean(getState().auth.userId)
      if (isAuthenticated) {
        // Ensure the group document exists in the groups collection
        // TODO: firestore for node color
        console.log("TODO: NODE COLOR IN FIRESTORE")

        // const groupDoc = await groupsCollection.doc(personId).get()
        // if (!groupDoc.exists) throw new Error("That group doesn't exist")

        // // Update the group's backgroundColor or textColor field
        // groupDoc.ref.update({ [field]: newColor })
      }

      const action: ISetNodeColor = {
        type: NetworkActionTypes.SET_NODE_COLOR,
        personId,
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
