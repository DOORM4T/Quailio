import { AppThunk } from "../../store"
import { IDeleteGroupAction, NetworkActionTypes } from "../networkTypes"
import { setNetworkLoading } from "./setNetworkLoading"

/**
 * Delete a group from a network
 * @param networkId
 * @param groupId
 * @returns
 */
export const deleteGroup = (networkId: string, groupId: string): AppThunk => (
  dispatch,
  getState,
) => {
  dispatch(setNetworkLoading(true))
  try {
    // TODO: Delete group in Firestore

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
