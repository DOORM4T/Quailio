import firebase from "firebase"
import { v4 as uuidv4 } from "uuid"
import {
  groupsCollection,
  networksCollection,
} from "../../../firebase/services"
import { AppThunk } from "../../store"
import randomRGBColor from "../helpers/randomColor"
import {
  ICreateGroupAction,
  INetwork,
  IRelationshipGroup,
  NetworkActionTypes,
} from "../networkTypes"
import { setNetworkLoading } from "./setNetworkLoading"

/**
 * Creates a Relationship Group in the current network
 * @param networkId ID of the network to add the group to
 * @param name name of the group
 * @returns
 */
export const createGroup = (
  networkId: string,
  name: string,
): AppThunk => async (dispatch, getState) => {
  dispatch(setNetworkLoading(true))

  // Initialize the group's data
  const uuid = uuidv4()
  const groupData: IRelationshipGroup = {
    name,
    personIds: [],
    backgroundColor: randomRGBColor(),
    textColor: "rgb(0,0,0)",
  }

  try {
    const isAuthenticated = Boolean(getState().auth.userId)
    if (isAuthenticated) {
      // User is authenticated? Make changes in Firestore.

      // Get the network doc and ensure it exists
      const networkDoc = await networksCollection.doc(networkId).get()
      if (!networkDoc.exists) throw new Error("Invalid network")

      // Ensure the UUID doesn't already exist in the groups collection (this should be super rare)
      const groupDoc = await groupsCollection.doc(uuid).get()
      if (groupDoc.exists)
        throw new Error("A group with that ID already exists")

      // Update just the groupIds field with the new group ID
      const updatedGroupIds: { groupIds: any } = {
        groupIds: firebase.firestore.FieldValue.arrayUnion(uuid),
      }

      // Add the group doc to the groups collection and update the networks groupIds array
      groupDoc.ref.set(groupData)
      networkDoc.ref.update(updatedGroupIds)
    }

    const action: ICreateGroupAction = {
      type: NetworkActionTypes.CREATE_GROUP,
      networkId,
      uuid,
      groupData,
    }

    return dispatch(action)
  } catch (error) {
    dispatch(setNetworkLoading(false))
    throw error
  }
}
