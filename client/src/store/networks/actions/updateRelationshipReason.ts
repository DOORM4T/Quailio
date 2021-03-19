import { peopleCollection } from "../../../firebase/services"
import { AppThunk } from "../../store"
import {
  IPerson,
  IRelationships,
  IUpdateRelationshipReasonAction,
  NetworkActionTypes,
} from "../networkTypes"
import { setNetworkLoading } from "./setNetworkLoading"

/**
 * Update a person's relationship reason from the person 1's point of view
 * @param p1Id ID of person 1
 * @param p2Id ID of person 2
 * @param newReason what person 2 means to person 1
 */

export const updateRelationshipReason = (
  p1Id: string,
  p2Id: string,
  newReason: string,
): AppThunk => async (dispatch, getState) => {
  dispatch(setNetworkLoading(true))

  try {
    /* Update the database if the user is authenticated */
    const uid = getState().auth.userId
    if (uid) {
      const p1Doc = await peopleCollection.doc(p1Id).get()
      const p2Doc = await peopleCollection.doc(p2Id).get()

      /* Ensure each person exists */
      if (!p1Doc.exists) throw new Error("Person 1 does not exist.")
      if (!p2Doc.exists) throw new Error("Person 2 does not exist.")

      /* Get person data */
      const p1Data = p1Doc.data() as IPerson
      const p2Data = p2Doc.data() as IPerson

      /* Update the relationship */
      const updatedP1Relationships: IRelationships = {
        ...p1Data.relationships,
        [p2Id]: newReason,
      }
      const updatedP2Relationships: IRelationships = {
        ...p2Data.relationships,
        [p1Id]: newReason,
      }

      /* Update each person's relationships field in Firestore */
      p1Doc.ref.update({ relationships: updatedP1Relationships })
      p2Doc.ref.update({ relationships: updatedP2Relationships })
    }

    /* Update state accordingly with personId and thumbnailUrl */
    const action: IUpdateRelationshipReasonAction = {
      type: NetworkActionTypes.UPDATE_PERSON_RELATIONSHIP,
      p1Id,
      p2Id,
      newReason,
    }

    return dispatch(action)
  } catch (error) {
    /* Failed to change the relationship reason*/
    dispatch(setNetworkLoading(false))
    throw error
  }
}
