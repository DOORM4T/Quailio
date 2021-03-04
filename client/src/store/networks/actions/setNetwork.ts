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
 * @param networkId
 */

export const setNetwork = (networkId: string): AppThunk => {
  return async (dispatch, getState) => {
    dispatch(setNetworkLoading(true))

    try {
      /* Stop if the user is not authenticated (Offline mode doesn't need to use this action) */
      const uid = getState().auth.userId
      if (!uid) throw new Error("There is no currently authenticated user.")

      /* Get data from Firestore  */
      /* Get the Network by its ID from the Networks collection */
      const networkData: INetwork = (
        await networksCollection.doc(networkId).get()
      ).data() as INetwork

      if (!networkData) throw new Error("Network not found.")

      /* Get all Person documents related to the Person IDs in the Network */
      const peopleData: IPerson[] = await getAllPersonDataFromDB(networkId)

      /* Create a current network object from Network and People state  */
      const currentNetwork: ICurrentNetwork = {
        ...networkData,
        people: peopleData,
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
export async function getAllPersonDataFromDB(networkId: string) {
  /* Get the Network by its ID from the Networks collection */
  const networkData: INetwork = (
    await networksCollection.doc(networkId).get()
  ).data() as INetwork

  if (!networkData) throw new Error("Network not found.")

  /* Get all Person documents related to the Person IDs in the Network */
  const getPeopleData = networkData.personIds.map(
    async (id) => (await peopleCollection.doc(id).get()).data() as IPerson,
  )
  const peopleData: IPerson[] = await Promise.all(getPeopleData)
  return peopleData
}
