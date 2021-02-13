import { peopleCollection, uploadThumbnail } from "../../../firebase"
import { AppThunk } from "../../store"
import { ISetPersonThumbnailAction, NetworkActionTypes } from "../networkTypes"
import { setNetworkLoading } from "./setNetworkLoading"

/**
 * Set a person's thumbnail
 * @param personId
 * @param thumbnailUrl
 */

export const setPersonThumbnail = (
  networkId: string,
  personId: string,
  thumbnailFile: File,
): AppThunk => async (dispatch) => {
  dispatch(setNetworkLoading(true))

  try {
    const personDoc = peopleCollection.doc(personId)

    /* Ensure the Person exists */
    const doesExist = (await personDoc.get()).exists
    if (!doesExist) throw new Error("That person does not exist.")

    /* Upload the thumbnail file */
    const thumbnailUrl = await uploadThumbnail(networkId, thumbnailFile)
    if (thumbnailUrl === null)
      throw new Error("Failed to upload the thumbnail.")

    /* Set the Person's thumbnail url field */
    await personDoc.set({ thumbnailUrl }, { merge: true }) // set + merge in case the field is undefined

    /* Update state accordingly with personId and thumbnailUrl */
    const action: ISetPersonThumbnailAction = {
      type: NetworkActionTypes.SET_PERSON_THUMBNAIL,
      personId,
      thumbnailUrl,
    }

    return dispatch(action)
  } catch (error) {
    /* Failed to set the Person's thumbnail url*/
    dispatch(setNetworkLoading(false))
    throw error
  }
}
