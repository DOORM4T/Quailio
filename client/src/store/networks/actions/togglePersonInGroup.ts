import { AppThunk } from "../../store"
import { ITogglePersonInGroupAction, NetworkActionTypes } from "../networkTypes"
import { setNetworkLoading } from "./setNetworkLoading"

/**
 * Add a person to a group in a network
 * @param networkId
 * @param groupId
 * @param personId
 * @param toggleOn add to the group if true, remove from the group if false
 * @returns
 */
export const togglePersonInGroup = (
  networkId: string,
  groupId: string,
  personId: string,
  toggleOn: boolean,
): AppThunk => (dispatch, getState) => {
  setNetworkLoading(true)

  try {
    // TODO: Firestore operations

    const action: ITogglePersonInGroupAction = {
      type: NetworkActionTypes.TOGGLE_PERSON_IN_GROUP,
      networkId,
      groupId,
      personId,
      toggleOn,
    }

    return dispatch(action)
  } catch (error) {
    setNetworkLoading(false)
    throw error
  }
}
