import {
  peopleCollection,
  personContentCollection,
} from "../../../firebase/firebase"
import { AppThunk } from "../../store"
import { IUpdatePersonContentAction, NetworkActionTypes } from "../networkTypes"
import { setNetworkLoading } from "./setNetworkLoading"

/**
 * Set a person's rich text content
 * @param personId
 * @param content
 */
export const updatePersonContent = (
  personId: string,
  content: string,
): AppThunk => {
  return async (dispatch) => {
    dispatch(setNetworkLoading(true))

    try {
      const personDoc = await peopleCollection.doc(personId).get()

      /* Ensure the Person exists */
      if (!personDoc.exists) throw new Error("That person does not exist.")

      /* Update the Person's content in a separate personContent collection */
      await personContentCollection.doc(personId).update({ content })

      const action: IUpdatePersonContentAction = {
        type: NetworkActionTypes.UPDATE_PERSON_CONTENT,
        personId,
        content,
      }

      return dispatch(action)
    } catch (error) {
      /* Failed to set the Person's thumbnail url*/
      dispatch(setNetworkLoading(false))
      throw error
    }
  }
}
