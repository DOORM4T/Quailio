import { networksCollection } from "../../../firebase/firebase"
import { AppThunk } from "../../store"
import { IRenameNetworkAction, NetworkActionTypes } from "../networkTypes"
import { setNetworkLoading } from "./setNetworkLoading"

/**
 * Rename a network by ID
 * @param networkId ID of the network to rename
 * @param name name to rename the network to
 */
export const renameNetwork = (
  networkId: string,
  name: string,
): AppThunk => async (dispatch, getState) => {
  dispatch(setNetworkLoading(true))

  try {
    /* Update the database if the user is authenticated */
    const uid = getState().auth.userId
    if (uid) {
      const networkDoc = await networksCollection.doc(networkId).get()

      /* Stop if the network does not exist */
      if (!networkDoc.exists)
        throw new Error(`Network ${networkId} does not exist`)

      /* Update the network's name field */
      await networkDoc.ref.update({ name })
    }

    /* Dispatch the rename action */
    const action: IRenameNetworkAction = {
      type: NetworkActionTypes.RENAME_NETWORK,
      networkId,
      newName: name,
    }
    dispatch(action)
  } catch (error) {
    /* Failed to rename the network */
    dispatch(setNetworkLoading(false))
    throw error
  }
}
