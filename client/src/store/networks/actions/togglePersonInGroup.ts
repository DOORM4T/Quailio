import firebase from "firebase"
import { groupsCollection } from "../../../firebase/services"
import { AppThunk } from "../../store"
import {
  IRelationshipGroup,
  ITogglePersonInGroupAction,
  NetworkActionTypes,
} from "../networkTypes"
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
): AppThunk => async (dispatch, getState) => {
  dispatch(setNetworkLoading(true))

  try {
    // TODO: Firestore operations
    // Ensure
    const isAuthenticated = Boolean(getState().auth.userId)
    if (isAuthenticated) {
      const groupDoc = await groupsCollection.doc(groupId).get()
      if (!groupDoc.exists) throw new Error("That group doesn't exist")

      const groupData = groupDoc.data() as IRelationshipGroup

      // If the personId is already in the group, remove them
      const hasPerson = groupData.personIds.includes(personId)
      if (hasPerson) {
        const removeFromGroupIds: { personIds: any } = {
          personIds: firebase.firestore.FieldValue.arrayRemove(personId),
        }
        groupDoc.ref.update(removeFromGroupIds)
      }

      // Otherwise, add them to the group
      else {
        const addToGroupIds: { personIds: any } = {
          personIds: firebase.firestore.FieldValue.arrayUnion(personId),
        }
        groupDoc.ref.update(addToGroupIds)
      }
    }

    const action: ITogglePersonInGroupAction = {
      type: NetworkActionTypes.TOGGLE_PERSON_IN_GROUP,
      networkId,
      groupId,
      personId,
      toggleOn,
    }

    return dispatch(action)
  } catch (error) {
    dispatch(setNetworkLoading(false))
    throw error
  }
}
