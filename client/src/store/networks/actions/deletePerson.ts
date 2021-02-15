import {
  networksCollection,
  peopleCollection,
} from "../../../firebase/firebase"
import { AppThunk } from "../../store"
import {
  IDeletePersonByIdAction,
  INetwork,
  IPerson,
  IRelationships,
  NetworkActionTypes,
} from "../networkTypes"
import { setNetworkLoading } from "./setNetworkLoading"

/**
 * Delete a Person from a Network by ID
 * @param networkId
 * @param personId
 */

export const deletePerson = (networkId: string, personId: string): AppThunk => {
  return async (dispatch) => {
    dispatch(setNetworkLoading(true))

    try {
      /* Remove the Person from the Network */
      const networkDoc = networksCollection.doc(networkId)
      const networkData = (await networkDoc.get()).data() as INetwork
      const peopleWithoutDeletedPerson = networkData.personIds.filter(
        (id) => id !== personId,
      )

      /* Update the Network's personIds field with the new list of person IDs */
      await networkDoc.update({ personIds: peopleWithoutDeletedPerson })

      /* Get the Person's document*/
      const personDoc = peopleCollection.doc(personId)
      const personData = (await (await personDoc.get()).data()) as IPerson

      /* Remove all relationships including the deleted Person */
      const relationshipUpdates: Promise<void>[] = Object.keys(
        personData.relationships,
      ).map(async (relationshipId) => {
        const otherPersonDoc = peopleCollection.doc(relationshipId)
        const otherPersonData = (await otherPersonDoc.get()).data() as IPerson
        const updatedRelationship: IRelationships = {
          ...otherPersonData.relationships,
        }
        delete updatedRelationship[personId]
        return otherPersonDoc.update({ relationships: updatedRelationship })
      })

      await Promise.all(relationshipUpdates)

      /* Delete the Person's document */
      await personDoc.delete()

      /* Update state accordingly with networkId and personId */
      const action: IDeletePersonByIdAction = {
        type: NetworkActionTypes.DELETE_PERSON,
        networkId,
        personId,
      }
      return dispatch(action)
    } catch (error) {
      /* Failed to delete the Person */
      dispatch(setNetworkLoading(false))
      throw error
    }
  }
}
