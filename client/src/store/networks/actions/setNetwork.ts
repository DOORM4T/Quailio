import {
  groupsCollection,
  networksCollection,
  peopleCollection,
} from "../../../firebase/services"
import { AppThunk } from "../../store"
import {
  ICurrentNetwork,
  INetwork,
  IPerson,
  IRelationshipGroup,
  IRelationshipGroups,
  ISetNetworkAction,
  NetworkActionTypes,
} from "../networkTypes"
import { setNetworkLoading } from "./setNetworkLoading"

/**
 * Select a network by its ID, setting the "currentNetwork" field in global state
 *
 * Also used to view shared networks
 *
 * (IMPORTANT: Offline users DO NOT use this action -- they instead rely on importing/exporting)
 * @param networkId
 */

export const setNetwork = (networkId: string, isShared?: boolean): AppThunk => {
  return async (dispatch, getState) => {
    dispatch(setNetworkLoading(true))

    try {
      /* Get network data from Firestore  */
      let networkDoc
      if (isShared) {
        // Network has a shared field? Any user can view the network.
        networkDoc = (
          await networksCollection
            .where("sharedProperties.sharedId", "==", networkId)
            .get()
        ).docs[0]

        if (!networkDoc) throw new Error("Shared network not found")
      } else {
        // Otherwise, this network should belong to the user
        // Stop if the user is not authenticated
        const uid = getState().auth.userId
        if (!uid) throw new Error("There is no currently authenticated user.")

        networkDoc = await networksCollection.doc(networkId).get()
      }

      if (!networkDoc.exists) throw new Error("Network not found.")
      const networkData = networkDoc.data() as INetwork

      /* Get all Person documents related to the Person IDs in the Network */
      const people: IPerson[] = await getAllPersonDataFromDB(
        networkData.personIds,
      )

      // Get all Relationship Group documents related to the Group IDs in the network
      let relationshipGroups: IRelationshipGroups = {}
      if (networkData.groupIds) {
        // The network might not have a groupIds field -- this is for backwards compatibility with legacy networks
        relationshipGroups = await getAllGroupsDataFromDB(networkData.groupIds)
      }

      /* Create a current network object from Network and People state  */
      const currentNetwork: ICurrentNetwork = {
        ...networkData,
        people,
        relationshipGroups,
      }

      /* Update state with the currentNetwork */
      const action: ISetNetworkAction = {
        type: NetworkActionTypes.SET,
        currentNetwork,
      }
      return dispatch(action)
    } catch (error) {
      /* Failed to get the network */
      dispatch(setNetworkLoading(false))
      throw error
    }
  }
}

async function getAllGroupsDataFromDB(groupIds: string[]) {
  // Create an array of Firestore operations to get each group by ID
  const getGroupsData = groupIds.map(async (groupId: string) => {
    const groupDoc = await groupsCollection.doc(groupId).get()
    if (groupDoc.exists) {
      const value = groupDoc.data() as IRelationshipGroup
      const keyValuePair = [groupId, value]
      return keyValuePair
    } else {
      return null
    }
  })

  // Run all the Promises to get the groups. Filter out any missing/empty groups.
  // Format: [string -- this is the groupId/key, IRelationshipGroup -- this is the value]
  const groupsData = (await Promise.all(getGroupsData)).filter((data) =>
    Boolean(data),
  ) as [string, IRelationshipGroup][]

  // Create the relationships group object
  const relationshipGroups: IRelationshipGroups = {}
  groupsData.forEach((groupData) => {
    const [groupId, group] = groupData
    relationshipGroups[groupId] = group
  })

  return relationshipGroups
}

/**
 * Gets all person data from Firestore
 * @param networkId
 */
export async function getAllPersonDataFromDB(personIds: string[]) {
  /* Get all Person documents related to the Person IDs in the Network */
  const getPeopleData = personIds.map(
    async (id) => (await peopleCollection.doc(id).get()).data() as IPerson,
  )
  const peopleData: IPerson[] = await Promise.all(getPeopleData)
  return peopleData
}
