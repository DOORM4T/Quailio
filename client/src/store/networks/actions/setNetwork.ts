import {
  auth,
  groupsCollection,
  networksCollection,
  peopleCollection,
} from "../../../firebase/services"
import { AppThunk } from "../../store"
import {
  ILegacyGroup,
  ILegacyGroupsNetwork,
  restructureLegacyGroups,
} from "../helpers/restuctureLegacyGroups"
import {
  ICurrentNetwork,
  INetwork,
  IPerson,
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

export const setNetwork = (
  networkId: string,
  isShared: boolean = false,
): AppThunk => {
  return async (dispatch, getState) => {
    dispatch(setNetworkLoading(true))

    try {
      const networkDoc = await getNetworkDoc(networkId, isShared)
      if (!networkDoc.exists) throw new Error("Network not found.")

      const networkData = networkDoc.data() as INetwork
      if ("groupIds" in networkData) await addLegacyGroupFields(networkData)

      const people = await getAllPersonDataFromDB(networkData.personIds)
      const currentNetwork: ICurrentNetwork = {
        ...networkData,
        people,
      }

      restructureLegacyGroups(currentNetwork, true)
      const action: ISetNetworkAction = {
        type: NetworkActionTypes.SET,
        currentNetwork,
      }
      return dispatch(action)
    } catch (error) {
      dispatch(setNetworkLoading(false))
      throw error
    }
  }
}

async function addLegacyGroupFields(networkData: never) {
  const legacyNetwork = networkData as INetwork & ILegacyGroupsNetwork
  const getGroups = legacyNetwork.groupIds.map((id) =>
    groupsCollection
      .doc(id)
      .get()
      .then((snap) => ({ id, ...(snap.data() as ILegacyGroup) })),
  )
  const groups = await Promise.all(getGroups)
  legacyNetwork.relationshipGroups = {}
  groups.forEach((group) => {
    legacyNetwork.relationshipGroups[group.id] = { ...group }
    // ID field is already tracked as the object key; remove it from the actual group object
    delete (legacyNetwork.relationshipGroups[group.id] as any).id
  })
}

async function getNetworkDoc(networkId: string, isShared: boolean) {
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
    const uid = auth.currentUser?.uid
    if (!uid) throw new Error("There is no currently authenticated user.")
    networkDoc = await networksCollection.doc(networkId).get()
  }

  return networkDoc
}

/**
 * Gets all person data from Firestore
 * @param networkId
 */
export async function getAllPersonDataFromDB(personIds: string[]) {
  /* Get all Person documents related to the Person IDs in the Network */
  const getPeopleData = personIds.map(
    async (id) =>
      (await peopleCollection.doc(id).get()).data() as IPerson | null,
  )
  const peopleData: (IPerson | null)[] = await Promise.all(getPeopleData)
  return peopleData.filter((p) => Boolean(p)) as IPerson[]
}
