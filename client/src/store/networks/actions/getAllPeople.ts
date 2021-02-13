import { networksCollection, peopleCollection } from "../../../firebase"
import { AppThunk } from "../../store"
import {
  IGetAllPeopleAction,
  INetwork,
  IPerson,
  NetworkActionTypes,
} from "../networkTypes"
import { setNetworkLoading } from "./setNetworkLoading"

/**
 * Gets all People in a Network
 * @param networkId
 */

export const getAllPeople = (networkId: string): AppThunk => {
  return async (dispatch) => {
    dispatch(setNetworkLoading(true))

    try {
      /* Get the Network by its ID from the Networks collection */
      const networkData: INetwork = (
        await networksCollection.doc(networkId).get()
      ).data() as INetwork

      if (!networkData) throw new Error("Network not found.")

      /* Get all Person documents related to the Person IDs in the Network */
      const peopleData: IPerson[] = await Promise.all(
        networkData.personIds.map(
          async (id) =>
            (await peopleCollection.doc(id).get()).data() as IPerson,
        ),
      )

      /* Update state with peopleData */
      const action: IGetAllPeopleAction = {
        type: NetworkActionTypes.GET_ALL_PEOPLE,
        people: peopleData,
      }
      return dispatch(action)
    } catch (error) {
      /* Failed to get the network */
      dispatch(setNetworkLoading(false))
      throw error
    }
  }
}
