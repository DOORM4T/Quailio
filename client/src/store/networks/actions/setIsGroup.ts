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
        // User is authenticated? Make changes in Firestore.

        // TODO: firestore for isGroup
        console.log("TODO: Update person's isGroup field in Firestore")

        // // Get the network doc and ensure it exists
        // const networkDoc = await networksCollection.doc(networkId).get()
        // if (!networkDoc.exists) throw new Error("Invalid network")

        // // Ensure the UUID doesn't already exist in the groups collection (this should be super rare)
        // const groupDoc = await groupsCollection.doc(uuid).get()
        // if (groupDoc.exists)
        //   throw new Error("A group with that ID already exists")

        // // Update just the groupIds field with the new group ID
        // const updatedGroupIds: { groupIds: any } = {
        //   groupIds: firebase.firestore.FieldValue.arrayUnion(uuid),
        // }

        // // Add the group doc to the groups collection and update the networks groupIds array
        // groupDoc.ref.set(groupData)
        // networkDoc.ref.update(updatedGroupIds)
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
