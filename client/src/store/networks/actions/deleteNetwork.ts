import {
  deleteNetworkThumbnails,
  networksCollection,
  usersCollection,
} from "../../../firebase/firebase"
import { AppThunk } from "../../store"
import { deletePerson } from "./deletePerson"
import {
  IDeleteNetworkByIdAction,
  INetwork,
  NetworkActionTypes,
} from "../networkTypes"
import { setNetworkLoading } from "./setNetworkLoading"
import { IUserDocument } from "../../auth/authTypes"

/**
 * Delete a Network by its ID
 * @param networkId
 */

export const deleteNetwork = (networkId: string): AppThunk => {
  return async (dispatch) => {
    dispatch(setNetworkLoading(true))

    try {
      /* Database updates */
      const networkDoc = networksCollection.doc(networkId)
      const networkData = (await networkDoc.get()).data() as INetwork
      if (!networkData) throw new Error("Network does not exist.")

      /* Delete the network from User docs containing the networkId */
      const userDocs = await usersCollection
        .where("networkIds", "array-contains", networkId)
        .get()
      userDocs.docs.forEach((doc) => {
        const data = doc.data() as IUserDocument
        const updatedNetworkIds = data.networkIds.filter(
          (id) => id !== networkId,
        )
        doc.ref.update({ networkIds: updatedNetworkIds })
      })

      /* Delete all People in the Network */
      const deletePeopleList = networkData.personIds.map(async (personId) => {
        try {
          await dispatch<any>(deletePerson(networkId, personId))
        } catch (error) {
          console.error(error)
        }
      })
      await Promise.all(deletePeopleList)

      /* Delete the Network */
      await networkDoc.delete()

      /* Delete all images used by the network */
      try {
        await deleteNetworkThumbnails(networkId)
      } catch (error) {
        /* Continue execution even if thumbnail deletion fails. An error here indicates the network had no uploaded thumbnails. */
        console.error(error)
      }

      /* Update state accordingly with networkId */
      const action: IDeleteNetworkByIdAction = {
        type: NetworkActionTypes.DELETE,
        networkId,
      }
      return dispatch(action)
    } catch (error) {
      /* Failed to delete the Network */
      dispatch(setNetworkLoading(false))
      throw error
    }
  }
}
