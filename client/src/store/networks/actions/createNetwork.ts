import { v4 as uuidv4 } from "uuid"
import { networksCollection, usersCollection } from "../../../firebase/services"
import { IUserDocument } from "../../auth/authTypes"
import { AppThunk } from "../../store"
import {
  ICreateNetworkAction,
  INetwork,
  NetworkActionTypes,
} from "../networkTypes"
import { setNetworkLoading } from "./setNetworkLoading"

/**
 * Create a new network
 * @param name
 */

export const createNetwork = (name: string): AppThunk => {
  return async (dispatch, getState) => {
    dispatch(setNetworkLoading(true))

    /* Create a network object */
    const newNetwork: INetwork = {
      id: uuidv4(),
      name,
      personIds: [],
      groupIds: [],
    }

    try {
      /* User is authenticated? Add the network to Firestore */
      const uid = getState().auth.userId
      if (uid) {
        /* Ensure the user's Firestore document exists */
        const userDoc = usersCollection.doc(uid)
        const doesUserDataExist = (await userDoc.get()).exists
        if (!doesUserDataExist) throw new Error("User document does not exist.")

        /* Add the Network's ID to the User's list of Network IDs */
        const userData = (await userDoc.get()).data() as IUserDocument
        const updatedUserNetworkIds = userData.networkIds.concat(newNetwork.id)
        userDoc.update({ networkIds: updatedUserNetworkIds })

        /* Create a document for the Network in the Networks collection */
        await networksCollection.doc(newNetwork.id).set(newNetwork)
      }

      /* Action for updating state with the new network */
      const action: ICreateNetworkAction = {
        type: NetworkActionTypes.CREATE,
        newNetwork,
      }

      return dispatch(action)
    } catch (error) {
      /* Failed to create the Network */
      dispatch(setNetworkLoading(false))
      throw error
    }
  }
}
