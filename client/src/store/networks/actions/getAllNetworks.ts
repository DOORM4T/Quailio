import {
  auth,
  networksCollection,
  usersCollection,
} from "../../../firebase/firebase"
import { IUserDocument } from "../../auth/authTypes"
import { AppThunk } from "../../store"
import {
  IGetAllNetworksIdsAction,
  INetwork,
  NetworkActionTypes,
} from "../networkTypes"
import { setNetworkLoading } from "./setNetworkLoading"

/**
 * Fetch all Networks belonging to the currently authenticated user
 * Network data consists only of the network IDs, network names, and person IDs.
 * Person data beyond person IDs are not fetched.
 */
export const getAllNetworks = (): AppThunk => {
  return async (dispatch, getState) => {
    dispatch(setNetworkLoading(true))

    try {
      /* Stop if the user is not authenticated (Offline mode doesn't need to use this action) */
      const uid = getState().auth.userId
      if (!uid) throw new Error("There is no currently authenticated user.")

      /* Get the IDs of the User's Networks   */
      const userData = (
        await usersCollection.doc(uid).get()
      ).data() as IUserDocument

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
