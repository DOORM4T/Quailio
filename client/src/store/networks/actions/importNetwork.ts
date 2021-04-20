import firebase from "firebase"
import { v4 as uuidv4 } from "uuid"
import {
  groupsCollection,
  networksCollection,
  peopleCollection,
  usersCollection,
} from "../../../firebase/services"
import { INetworkJSON } from "../../../helpers/getNetworkJSON"
import { AppThunk } from "../../store"
import {
  ICurrentNetwork,
  IImportNetworkAction,
  INetwork,
  IPerson,
  NetworkActionTypes,
} from "../networkTypes"
import { setNetworkLoading } from "./setNetworkLoading"

/**
 * Import a network from JSON
 *
 * Is Authenticated: Imports then network to Firestore for the user
 * @param networkJSON object with network JSON properties
 */
export const importNetwork = (networkJSON: INetworkJSON): AppThunk => {
  return async (dispatch, getState) => {
    dispatch(setNetworkLoading(true))

    try {
      const currentNetworkCopy = makeNetworkCopy(networkJSON)

      const uid = getState().auth.userId
      if (uid) await importToFirestore(uid, currentNetworkCopy)

      const action: IImportNetworkAction = {
        type: NetworkActionTypes.IMPORT_NETWORK,
        asCurrentNetwork: currentNetworkCopy,
      }

      return dispatch(action)
    } catch (error) {
      /* Failed to import the Network */
      dispatch(setNetworkLoading(false))
      throw error
    }
  }
}

/**
 * @param networkJSON
 * @returns a current network with updated UUIDs
 */
function makeNetworkCopy(networkJSON: INetworkJSON) {
  const groupsCopy = { ...networkJSON.relationshipGroups }
  const groupIds = Object.keys(groupsCopy)
  const peopleCopy = [...networkJSON.people]

  groupIds.forEach(updateGroupCopyId)
  peopleCopy.forEach(updatePersonCopyId)

  const updatedPersonIds = peopleCopy.map((p) => p.id)
  const updatedGroupIds = Object.keys(groupsCopy)

  const updatedNetworkId = uuidv4()
  const updatedCurrentNetwork: ICurrentNetwork = {
    ...networkJSON,
    id: updatedNetworkId,
    people: peopleCopy,
    personIds: updatedPersonIds,
    groupIds: updatedGroupIds,
    relationshipGroups: groupsCopy,
  }

  return updatedCurrentNetwork

  //
  // #region makeNetworkCopy: HELPERS
  //
  function updateGroupCopyId(groupId: string) {
    const groupData = { ...groupsCopy[groupId] }

    const newGroupId = uuidv4()
    delete groupsCopy[groupId]
    groupsCopy[newGroupId] = groupData
  }

  function updatePersonCopyId(personCopy: IPerson) {
    const oldId = personCopy.id
    personCopy.id = uuidv4()
    peopleCopy.forEach(updatePersonIdInRels)

    const groupCopyIds = Object.keys(groupsCopy)
    groupCopyIds.forEach(updatePersonIdInGroups)

    // #region assignNewIds: HELPERS
    function updatePersonIdInRels(otherPerson: IPerson) {
      const { id: newId } = personCopy

      const hasRelationship = oldId in otherPerson.relationships
      if (!hasRelationship) return

      const relationshipCopy = otherPerson.relationships[oldId]
      delete otherPerson.relationships[oldId]

      otherPerson.relationships[newId] = relationshipCopy
    }

    function updatePersonIdInGroups(groupId: string) {
      const group = groupsCopy[groupId]

      const personIdIndexInGroup = group.personIds.findIndex(
        (pid) => pid === oldId,
      )
      if (personIdIndexInGroup === -1) return

      group.personIds[personIdIndexInGroup] = personCopy.id
    }

    // #endregion assignNewIds: HELPERS
  }

  //
  // #endregion makeNetworkCopy: HELPERS
  //
}

/**
 * @param uid authenticated user's uid
 * @param toImport current network copy to import
 */
async function importToFirestore(uid: string, toImport: ICurrentNetwork) {
  // Add the network's ID to the user doc networks list
  const addToNetworkIds: { networkIds: any } = {
    networkIds: firebase.firestore.FieldValue.arrayUnion(toImport.id),
  }
  await usersCollection.doc(uid).update(addToNetworkIds)

  //
  // Add the network
  //
  const networkDoc = await networksCollection.doc(toImport.id).get()

  // Ensure the network doesn't already exist (in case the new UUID clashes, under astronomical odds)
  if (networkDoc.exists)
    throw new Error(
      "Network ID clashed with an existing network. How unfortunate!",
    )

  // Actually add the network
  const network: INetwork = {
    id: toImport.id,
    name: toImport.name,
    personIds: toImport.personIds,
    groupIds: toImport.groupIds, // TODO: Update group IDs
  }
  await networkDoc.ref.set(network)

  //
  // Add every person
  //
  const uploadPersonPromises = toImport.people.map(async (p) => {
    const personDoc = await peopleCollection.doc(p.id).get()

    // Stop importing if a person already exists (ID clash. This should very rarely happen.)
    if (personDoc.exists)
      throw new Error(
        "Person ID clashed with an existing person. Stopping import.",
      )

    // Return a promise to set the person document
    const setPersonPromise = personDoc.ref.set(p)
    return setPersonPromise
  })

  await Promise.all(uploadPersonPromises)

  // TODO: Create group docs in Firestore
  const uploadGroupsPromises = Object.entries(toImport.relationshipGroups).map(
    async (groupEntry) => {
      const [groupId, group] = groupEntry
      const groupDoc = await groupsCollection.doc(groupId).get()

      // Stop importing if the group already exists (ID clash. This should very rarely happen.)
      if (groupDoc.exists)
        throw new Error(
          "Group ID clashed with an existing group. Stopping import.",
        )

      // Return a promise to set the person document
      const setGroupPromise = groupDoc.ref.set(group)
      return setGroupPromise
    },
  )

  await Promise.all(uploadGroupsPromises)
}
