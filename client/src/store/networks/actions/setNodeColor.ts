import { peopleCollection } from "../../../firebase/services"
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
        const personDoc = await peopleCollection.doc(personId).get()
        if (!personDoc.exists) throw new Error("Person does not exist")
        personDoc.ref.update({ [field]: newColor })
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
