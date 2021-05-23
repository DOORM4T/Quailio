import {
  networksCollection,
  peopleCollection,
} from "../../../firebase/services"
import { AppThunk } from "../../store"
import {
  ICurrentNetwork,
  INetwork,
  IPerson,
  ISetNetworkAction,
  NetworkActionTypes,
} from "../networkTypes"
import { setNetworkLoading } from "./setNetworkLoading"

/**
 * Select a network by its ID, setting the "currentNetwork" field in global state
 *
 * Also used to view shared networks
 *
 * (IMPORTANT: Offline users DO NOT use this action -- they instead rely on importing/exporting)
 * @param networkId
 */

export const setNetwork = (networkId: string, isShared?: boolean): AppThunk => {
  return async (dispatch, getState) => {
    dispatch(setNetworkLoading(true))

    try {
      /* Get network data from Firestore  */
      let networkDoc
      if (isShared) {
        // Network has a shared field? Any user can view the network.
        networkDoc = (
          await networksCollection
            .where("sharedProperties.sharedId", "==", networkId)
            .get()
        ).docs[0]

        if (!networkDoc) throw new Error("Shared network not found")
      } else {
        // Otherwise, this network should belong to the user
        // Stop if the user is not authenticated
        const uid = getState().auth.userId
        if (!uid) throw new Error("There is no currently authenticated user.")

        networkDoc = await networksCollection.doc(networkId).get()
      }

      if (!networkDoc.exists) throw new Error("Network not found.")
      const networkData = networkDoc.data() as INetwork

      /* Get all Person documents related to the Person IDs in the Network */
      const people: IPerson[] = await getAllPersonDataFromDB(
        networkData.personIds,
      )

      /* Create a current network object from Network and People state  */
      const currentNetwork: ICurrentNetwork = {
        ...networkData,
        people,
      }

      /* Update state with the currentNetwork */
      const action: ISetNetworkAction = {
        type: NetworkActionTypes.SET,
        currentNetwork,
      }
      return dispatch(action)
    } catch (error) {
      /* Failed to get the network */
      dispatch(setNetworkLoading(false))
      throw error
    }
  }
}

/**
 * Gets all person data from Firestore
 * @param networkId
 */
export async function getAllPersonDataFromDB(personIds: string[]) {
  /* Get all Person documents related to the Person IDs in the Network */
  const getPeopleData = personIds.map(
    async (id) => (await peopleCollection.doc(id).get()).data() as IPerson,
  )
  const peopleData: IPerson[] = await Promise.all(getPeopleData)
  return peopleData
}
