import { peopleCollection } from "../../../firebase/services"
import { uploadThumbnail } from "../../../firebase/thumbnailManagement"
import { AppThunk } from "../../store"
import { ISetPersonThumbnailAction, NetworkActionTypes } from "../networkTypes"
import { setNetworkLoading } from "./setNetworkLoading"

const UPLOAD_LIMIT = 1024 * 1024 // 1 MB Limit

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

  try {
    // If a thumbnail was uploaded, ensure it fits the size limit
    if (thumbnail instanceof File && thumbnail.size > UPLOAD_LIMIT) {
      window.alert("Image size must be under 1 MB")
      throw new Error("Uploaded thumbnail must be under 1 MB")
    }

    let thumbnailUrl: string | null = null

    const uid = getState().auth.userId
    if (uid) {
      /* If the user is authenticated, try to upload the image to Firebase storage */
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
      /* 
        1. Uploaded images are represented as data URLs in Zero-login mode
        2. OR Set the image by using a link
        */
      if (thumbnail instanceof File) {
        // Convert the uploaded image to a data URL
        const buffer = await thumbnail.arrayBuffer()
        const blob = new Blob([buffer])

        const reader = new FileReader()
        reader.readAsDataURL(blob)

        // Should get a data:application/octet-stream data url
        const result = await new Promise((res) => {
          reader.onloadend = () => {
            res(reader.result)
          }
        })

        thumbnailUrl = result as string
      } else {
        // The thumbnail is a URL string
        thumbnailUrl = thumbnail
      }
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
