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
  return async (dispatch, getState) => {
    dispatch(setNetworkLoading(true))

    /* Initialize the new Person's document */
    const newPerson: IPerson = {
      id: uuidv4(),
      name,
      relationships: {},
      content: "",
    }

    try {
      /* Database updates, if applicable */

      /* Update the database if the user is authenticated */
      const uid = getState().auth.userId
      if (uid) {
        /* Ensure the network exists in Firestore */
        const networkDoc = await networksCollection.doc(networkId).get()
        if (!networkDoc.exists)
          throw new Error(`Network ${networkId} does not exist`)

        /* Get the network's data */
        const networkData: INetwork = networkDoc.data() as INetwork

        /* Update just the personIds field of the Network document */
        const updatedPersonIds = networkData.personIds.concat(newPerson.id)
        await networkDoc.ref.update({ personIds: updatedPersonIds })

        /* Create a document for the new Person */
        await peopleCollection.doc(newPerson.id).set(newPerson)
      }

      /* Update state with the new person */
      const action: IAddPersonAction = {
        type: NetworkActionTypes.ADD_PERSON,
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
