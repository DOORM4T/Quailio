import { networksCollection } from "../../../firebase/services"
import { AppThunk } from "../../store"
import { IUnshareNetworkAction, NetworkActionTypes } from "../networkTypes"
import { setNetworkLoading } from "./setNetworkLoading"

export const unshareNetwork = (networkId: string): AppThunk => async (
  dispatch,
  getState,
) => {
  dispatch(setNetworkLoading(true))

  try {
    // Firestore operations -- IFF the is authenticated
    const isAuthenticated = Boolean(getState().auth.userId)
    if (!isAuthenticated) throw new Error("User is not authenticated")

    const networkDoc = await networksCollection.doc(networkId).get()
    if (!networkDoc.exists) throw new Error("That network doesn't exist")

    // Set the shared ID to null
    networkDoc.ref.update({ ["sharedProperties.sharedId"]: null })

    // Dispatch the action to the networks reducer
    const action: IUnshareNetworkAction = {
      type: NetworkActionTypes.UNSHARE_NETWORK,
      networkId,
    }

    return dispatch(action)
  } catch (error) {
    dispatch(setNetworkLoading(false))
    throw error
  }
}
