import { peopleCollection } from "../../../firebase/services"
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
  return async (dispatch, getState) => {
    dispatch(setNetworkLoading(true))

    try {
      /* Update the database if the user is authenticated */
      const uid = getState().auth.userId
      if (uid) {
        const personDoc = await peopleCollection.doc(personId).get()

        /* Stop if the Person does not exist */
        if (!personDoc.exists) throw new Error("That person does not exist.")

        /* Update person's content field  */
        await personDoc.ref.update({ content })
      }

      /* Action to update state with the new person content */
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
