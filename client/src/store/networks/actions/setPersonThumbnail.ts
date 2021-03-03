import { peopleCollection, uploadThumbnail } from "../../../firebase/firebase"
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
  thumbnail: File | string,
): AppThunk => async (dispatch, getState) => {
  dispatch(setNetworkLoading(true))

  let thumbnailUrl: string | null = null

  try {
    // TODO: Set thumbnail by URL -- this is important for unauthenticated users!
    // For now, setting thumbnails is only available to authenticated users.

    /* Stop if the user is not authenticated */
    const uid = getState().auth.userId
    if (uid) {
      const personDoc = peopleCollection.doc(personId)

      /* Ensure the Person exists */
      const doesExist = (await personDoc.get()).exists
      if (!doesExist) throw new Error("That person does not exist.")

      if (thumbnail instanceof File) {
        /* thumbnail is a File? Upload the thumbnail file */
        thumbnailUrl = await uploadThumbnail(networkId, thumbnail)
        if (thumbnailUrl === null)
          throw new Error("Failed to upload the thumbnail.")
      } else {
        // Otherwise, this means the user passed a URL string
        thumbnailUrl = thumbnail
      }

      /* Set the Person's thumbnail url field */
      await personDoc.set({ thumbnailUrl }, { merge: true }) // set + merge in case the field is undefined
    } else {
      // Zero-login mode: user can only use URL strings for thumbnails
      if (thumbnail instanceof File)
        throw new Error("Only authenticated users can upload thumbnails.")

      // The thumbnail is a URL string
      thumbnailUrl = thumbnail
    }

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
