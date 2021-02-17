import { v4 as uuidv4 } from "uuid"
import {
  auth,
  networksCollection,
  usersCollection,
} from "../../../firebase/firebase"
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
  return async (dispatch) => {
    dispatch(setNetworkLoading(true))

    /* Initialize the Network */
    const newNetwork: INetwork = {
      id: uuidv4(),
      name,
      personIds: [],
    }

    try {
      /* Database updates */
      /* Get the authenticated User's ID */
      const uid = auth.currentUser?.uid
      if (!uid) throw new Error("There is no currently authenticated user.")

      /* Add the Network's ID to the User's list of Network IDs */
      const userDoc = usersCollection.doc(uid)
      const doesUserDataExist = (await userDoc.get()).exists
      if (!doesUserDataExist) throw new Error("User document does not exist.")

      const userData = (await userDoc.get()).data() as IUserDocument
      const updatedUserNetworkIds = userData.networkIds.concat(newNetwork.id)
      userDoc.update({ networkIds: updatedUserNetworkIds })

      /* Create a document for the Network in the Networks collection */
      await networksCollection.doc(newNetwork.id).set(newNetwork)

      /* Update state with the newNetwork */
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
