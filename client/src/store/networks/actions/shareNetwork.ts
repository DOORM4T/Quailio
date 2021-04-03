import { v4 as uuidv4 } from "uuid"
import { networksCollection } from "../../../firebase/services"
import { AppThunk } from "../../store"
import {
  ISharedNetworkProperties,
  IShareNetworkAction,
  NetworkActionTypes,
} from "../networkTypes"
import { setNetworkLoading } from "./setNetworkLoading"

export const shareNetwork = (networkId: string): AppThunk => async (
  dispatch,
  getState,
) => {
  dispatch(setNetworkLoading(true))

  try {
    // Generate a shared properties object with a random shared ID
    const sharedProperties: ISharedNetworkProperties = {
      sharedId: uuidv4(),
      allowList: [],
    }

    // Firestore operations -- IFF the is authenticated
    const isAuthenticated = Boolean(getState().auth.userId)
    if (!isAuthenticated) throw new Error("User is not authenticated")

    const networkDoc = await networksCollection.doc(networkId).get()
    if (!networkDoc.exists) throw new Error("That network doesn't exist")

    networkDoc.ref.update({ sharedProperties })

    // Dispatch the action to the networks reducer
    const action: IShareNetworkAction = {
      type: NetworkActionTypes.SHARE_NETWORK,
      networkId,
      sharedProperties,
    }

    return dispatch(action)
  } catch (error) {
    dispatch(setNetworkLoading(false))
    throw error
  }
}
