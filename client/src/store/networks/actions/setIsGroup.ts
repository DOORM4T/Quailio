import { peopleCollection } from "../../../firebase/services"
import { AppThunk } from "../../store"
import { ISetIsGroupAction, NetworkActionTypes } from "../networkTypes"
import { setNetworkLoading } from "./setNetworkLoading"

/**
 * Sets a person's isGroup field
 */
export const setIsGroup =
  (networkId: string, personId: string, isGroup: boolean): AppThunk =>
  async (dispatch, getState) => {
    dispatch(setNetworkLoading(true))

    try {
      const isAuthenticated = Boolean(getState().auth.userId)
      if (isAuthenticated) {
        const personDoc = await peopleCollection.doc(personId).get()
        if (!personDoc.exists) throw new Error("Person does not exist")
        personDoc.ref.update({ isGroup })
      }

      const action: ISetIsGroupAction = {
        type: NetworkActionTypes.SET_IS_GROUP,
        networkId,
        personId,
        isGroup,
      }

      return dispatch(action)
    } catch (error) {
      dispatch(setNetworkLoading(false))
      throw error
    }
  }
