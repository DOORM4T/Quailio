import {
  auth,
  IFirebaseUser,
  networksCollection,
  usersCollection,
} from "../../../firebase/firebase"
import { AppThunk } from "../../store"
import {
  IGetAllNetworksIdsAction,
  INetwork,
  NetworkActionTypes,
} from "../networkTypes"
import { setNetworkLoading } from "./setNetworkLoading"

/**
 * Get all Networks belonging to the currently authenticated user
 */

export const getAllNetworks = (): AppThunk => {
  return async (dispatch) => {
    dispatch(setNetworkLoading(true))

    try {
      /* Check for an authenticated User */
      const uid = auth.currentUser?.uid
      if (!uid) throw new Error("There is no currently authenticated user.")

      /* Get the IDs of the User's Networks   */
      const userData: IFirebaseUser = (
        await usersCollection.doc(uid).get()
      ).data() as IFirebaseUser

      if (!userData) throw new Error("User data not found.")

      /* Get the Networks corresponding to the IDs */
      const networkData: INetwork[] = await Promise.all(
        userData.networkIds.map(
          async (id) =>
            (await networksCollection.doc(id).get()).data() as INetwork,
        ),
      )

      /* Ensure Network data exists for each Network */
      const existingNetworkData = networkData.filter((data) => Boolean(data))

      /* Update state accordingly with networks data */
      const action: IGetAllNetworksIdsAction = {
        type: NetworkActionTypes.GET_ALL,
        networks: existingNetworkData,
      }
      return dispatch(action)
    } catch (error) {
      /* Failed to get list of network IDs */
      dispatch(setNetworkLoading(false))
      throw error
    }
  }
}
