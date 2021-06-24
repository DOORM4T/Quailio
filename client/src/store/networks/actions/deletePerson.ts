import {
  networksCollection,
  peopleCollection,
} from "../../../firebase/services"
import { AppThunk } from "../../store"
import { pushActionToUndoStack } from "../../ui/uiActions"
import { ICreatePersonStackAction, StackActionTypes } from "../../ui/uiTypes"
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
 * @param doAddToUndoStack whether to add the opposite action to the undo stack (should explicitly set to false when calling this action from the popAction in uiActions to avoid unecessary pushes to the undo stack)
 */

export const deletePerson = (
  networkId: string,
  personId: string,
  doAddToUndoStack: boolean = true,
): AppThunk => {
  return async (dispatch, getState) => {
    dispatch(setNetworkLoading(true))

    try {
      /* Update the database if the user is authenticated */
      const uid = getState().auth.userId
      if (uid) {
        /* Ensure the network exists */
        const networkDoc = await networksCollection.doc(networkId).get()
        if (!networkDoc.exists)
          throw new Error(`Network ${networkId} does not exist`)

        /* Remove the Person from the Network */
        const networkData = networkDoc.data() as INetwork
        const peopleWithoutDeletedPerson = networkData.personIds.filter(
          (id) => id !== personId,
        )

        /* Update the Network's personIds field with the new list of person IDs */
        await networkDoc.ref.update({ personIds: peopleWithoutDeletedPerson })

        /* Get the Person's document*/
        const personDoc = peopleCollection.doc(personId)
        const personData = (await (await personDoc.get()).data()) as IPerson

        /* Remove all relationships including the deleted Person */
        const relationshipUpdates = Object.keys(personData.relationships)
          .map(async (relationshipId) => {
            const otherPersonDoc = await peopleCollection
              .doc(relationshipId)
              .get()
            if (!otherPersonDoc.exists) return null
            const otherPersonData = otherPersonDoc.data() as IPerson
            const updatedRelationship: IRelationships = {
              ...otherPersonData.relationships,
            }
            delete updatedRelationship[personId]
            return otherPersonDoc.ref.update({
              relationships: updatedRelationship,
            })
          })
          .filter((update) => update !== null) as Promise<void>[]

        await Promise.all(relationshipUpdates)

        /* Delete the Person's document */
        await personDoc.delete()
      }

      // #region Add to the UNDO stack
      // Undoing a CREATE action means we DELETE the person
      if (doAddToUndoStack) {
        const person = getState().networks.currentNetwork?.people.find(
          (p) => p.id === personId,
        )
        if (!person) throw new Error("Person not found")

        const undoAction: ICreatePersonStackAction = {
          type: StackActionTypes.CREATE,
          payload: person,
        }
        dispatch(pushActionToUndoStack([undoAction]))
      }
      // //#endregion

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
