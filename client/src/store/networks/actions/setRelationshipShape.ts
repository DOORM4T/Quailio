import { peopleCollection } from "../../../firebase/services"
import { AppThunk } from "../../store"
import {
  ConnectionShape,
  IPerson,
  IRelationships,
  ISetRelationshipShape,
  NetworkActionTypes,
} from "../networkTypes"
import { setNetworkLoading } from "./setNetworkLoading"

/**
 * Update the connection shape at the end of a person's connection
 * @param networkId
 * @param personId
 * @param relationshipId
 * @param shape
 */

export const setRelationshipShape = (
  networkId: string,
  personId: string,
  relationshipId: string,
  shape: ConnectionShape,
): AppThunk => async (dispatch, getState) => {
  dispatch(setNetworkLoading(true))

  try {
    const uid = getState().auth.userId
    if (uid) await updateShapeInFirestore(personId, relationshipId, shape)

    const action: ISetRelationshipShape = {
      type: NetworkActionTypes.SET_RELATIONSHIP_SHAPE,
      networkId,
      personId,
      relationshipId,
      shape,
    }

    return dispatch(action)
  } catch (error) {
    dispatch(setNetworkLoading(false))
    throw error
  }
}

async function updateShapeInFirestore(
  personId: string,
  relationshipId: string,
  shape: ConnectionShape,
) {
  const personDoc = await peopleCollection.doc(personId).get()
  if (!personDoc.exists) throw new Error("That person does not exist")

  const person = personDoc.data() as IPerson
  const updatedRelationship: IRelationships = {
    ...person.relationships,
    [relationshipId]: { ...person.relationships[relationshipId], shape },
  }

  personDoc.ref.update({ relationships: updatedRelationship })
}
