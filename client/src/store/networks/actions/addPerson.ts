import { v4 as uuidv4 } from "uuid"
import {
  networksCollection,
  peopleCollection,
} from "../../../firebase/firebase"
import { AppThunk } from "../../store"
import {
  IAddPersonAction,
  INetwork,
  IPerson,
  NetworkActionTypes,
} from "../networkTypes"
import { setNetworkLoading } from "./setNetworkLoading"

/**
 * Add a new Person to an existing Network
 * @param networkId ID of the network to add the person to
 * @param name new person's name
 */

export const addPerson = (networkId: string, name: string): AppThunk => {
  return async (dispatch) => {
    dispatch(setNetworkLoading(true))

    /* Initialize the new Person's document */
    const newPerson: IPerson = {
      id: uuidv4(),
      name,
      relationships: {},
      content: "",
    }

    try {
      /* Database updates */
      /* Get the network document that will add this new Person */
      const networkDoc = networksCollection.doc(networkId)
      const networkData: INetwork = (await networkDoc.get()).data() as INetwork

      /* Ensure the network exists */
      if (!networkData) throw new Error("Network does not exist.")

      /* Update just the personIds field of the Network document */
      const updatedPersonIds = networkData.personIds.concat(newPerson.id)
      await networkDoc.update({ personIds: updatedPersonIds })

      /* Create a document for the new Person */
      await peopleCollection.doc(newPerson.id).set(newPerson)

      /* Update state with the new person */
      const action: IAddPersonAction = {
        type: NetworkActionTypes.ADD_PERSON,
        personId: newPerson.id,
        personData: newPerson,
      }
      return dispatch(action)
    } catch (error) {
      /* Failed to add the new Person */
      dispatch(setNetworkLoading(false))
      throw error
    }
  }
}
