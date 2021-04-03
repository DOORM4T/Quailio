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
 * @param networkId
 */

export const setNetwork = (networkId: string): AppThunk => {
  return async (dispatch, getState) => {
    dispatch(setNetworkLoading(true))

    try {
      // Stop if the user is not authenticated (Offline mode doesn't need to use this action)

      // TODO: network has a shared field?

      const uid = getState().auth.userId
      if (!uid) throw new Error("There is no currently authenticated user.")

      /* Get data from Firestore  */
      /* Get the Network by its ID from the Networks collection */
      const networkData: INetwork = (
        await networksCollection.doc(networkId).get()
      ).data() as INetwork

      if (!networkData) throw new Error("Network not found.")

      /* Get all Person documents related to the Person IDs in the Network */
      const people: IPerson[] = await getAllPersonDataFromDB(networkId)

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
export async function getAllPersonDataFromDB(networkId: string) {
  /* Get the Network by its ID from the Networks collection */
  const networkData: INetwork = (
    await networksCollection.doc(networkId).get()
  ).data() as INetwork

  if (!networkData) throw new Error("Network not found.")

  /* Get all Person documents related to the Person IDs in the Network */
  const getPeopleData = networkData.personIds.map(
    async (id) => (await peopleCollection.doc(id).get()).data() as IPerson,
  )
  const peopleData: IPerson[] = await Promise.all(getPeopleData)
  return peopleData
}
