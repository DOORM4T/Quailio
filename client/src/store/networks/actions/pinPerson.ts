import { AppThunk } from "../../store"
import { ISetNodePinAction, NetworkActionTypes } from "../networkTypes"
import { setNetworkLoading } from "./setNetworkLoading"

/**
 * Set a person's pin position for the Force Graph
 * @param networkId
 * @param nodeId
 * @param pinXY
 */
export const pinNode = (
  networkId: string,
  nodeId: string, // Can refer to a person ID or group ID -- groups are represented as nodes in the Force Graph and can be pinned
  isGroup: boolean,
  pinXY: { x: number; y: number },
): AppThunk => {
  return async (dispatch, getState) => {
    dispatch(setNetworkLoading(true))

    try {
      /* Firestore updates if the user is authenticated */
      //   const uid = getState().auth.userId
      //   if (uid) {
      //     const personDoc = await peopleCollection.doc(personId).get()

      //     /* Stop if the Person does not exist */
      //     if (!personDoc.exists) throw new Error("That person does not exist.")

      //     /* Update person's content field  */
      //     await personDoc.ref.update({ content })
      //   }

      /* Action to update state with the new person content */
      const action: ISetNodePinAction = {
        type: NetworkActionTypes.SET_NODE_PIN,
        networkId,
        nodeId,
        isGroup,
        pinXY,
      }

      return dispatch(action)
    } catch (error) {
      /* Failed to set the person's pinXY state*/
      dispatch(setNetworkLoading(false))
      throw error
    }
  }
}
