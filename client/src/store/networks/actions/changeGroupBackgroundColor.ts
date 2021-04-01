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
): AppThunk => (dispatch, getState) => {
  dispatch(setNetworkLoading(true))

  try {
    // TODO: Firestore

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
