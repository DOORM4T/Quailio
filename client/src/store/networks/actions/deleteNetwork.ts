import {
  groupsCollection,
  networksCollection,
  peopleCollection,
  usersCollection,
} from "../../../firebase/services"
import { deleteNetworkThumbnails } from "../../../firebase/thumbnailManagement"
import { IUserDocument } from "../../auth/authTypes"
import { AppThunk } from "../../store"
import {
  IDeleteNetworkByIdAction,
  INetwork,
  NetworkActionTypes,
} from "../networkTypes"
import { setNetworkLoading } from "./setNetworkLoading"

/**
 * Delete a Network by its ID
 * @param networkId
 */

export const deleteNetwork = (networkId: string): AppThunk => {
  return async (dispatch, getState) => {
    dispatch(setNetworkLoading(true))

    try {
      /* Delete the network from Firestore if the user is authenticated (and if the network exists, of course) */
      const uid = getState().auth.userId
      if (uid) {
        /* Ensure the network exists in Firestore */
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
            /* NOT dispatching the deletePerson action since that updates relationships. 
            We don't care about updating relationships since every person will be deleted. */
            await peopleCollection.doc(personId).delete()
          } catch (error) {
            /* Log any errors; keep going even if a person isn't found */
            console.error(error)
          }
        })
        await Promise.all(deletePeopleList)

        // Delete all groups in the network
        const deleteGroupsList = networkData.groupIds.map(async (groupId) => {
          try {
            await groupsCollection.doc(groupId).delete()
          } catch (error) {
            /* Log any errors; keep going even if a person isn't found */
            console.error(error)
          }
        })
        await Promise.all(deleteGroupsList)

        /* Delete the Network */
        await networkDoc.delete()

        /* Delete all images used by the network */
        try {
          await deleteNetworkThumbnails(networkId)
        } catch (error) {
          /* Continue execution even if thumbnail deletion fails. An error here indicates the network had no uploaded thumbnails. */
          console.error(error)
        }
      }

      /* Action to update state using deleted network's ID */
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
