import firebase from "firebase"
import { v4 as uuidv4 } from "uuid"
import {
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
  IRelationship,
  NetworkActionTypes,
} from "../networkTypes"
import { resetLocalNetworks } from "./resetLocalNetworks"
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
      if (!uid) dispatch(resetLocalNetworks()) // Clears array of networks in global state -- offline users can't use this since they only have IDs whose data cannot be fetched

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
  restructureLegacyGroups()

  const peopleCopy = [...networkJSON.people]
  peopleCopy.forEach(updatePersonCopyId)

  const updatedPersonIds = peopleCopy.map((p) => p.id)

  const updatedNetworkId = uuidv4()
  const updatedCurrentNetwork: ICurrentNetwork = {
    ...networkJSON,
    id: updatedNetworkId,
    people: peopleCopy,
    personIds: updatedPersonIds,
  }

  return updatedCurrentNetwork

  //
  // #region makeNetworkCopy: HELPERS
  //

  function restructureLegacyGroups() {
    if (!("relationshipGroups" in networkJSON)) return
    console.log("LEGACY GROUPS DETECTED")

    interface ILegacyGroup {
      name: string
      personIds: string[]
      pinXY?: { x: number; y: number }
      backgroundColor?: string
      textColor?: string
    }
    const legacyNetwork: INetworkJSON & {
      relationshipGroups: {
        [groupId: string]: ILegacyGroup
      }
    } = networkJSON
    const groupsAsPeople = Object.entries(legacyNetwork.relationshipGroups).map(
      groupToPerson,
    )

    groupsAsPeople.forEach((p) => legacyNetwork.people.push(p))
    delete networkJSON["relationshipGroups"]
    return

    // #region restructureLegacyGroup Helper Functions
    function groupToPerson(entry: [string, ILegacyGroup]): IPerson {
      const [groupId, group] = entry
      const { name, backgroundColor, textColor, pinXY } = group
      const groupAsPerson: IPerson = {
        isGroup: true,
        id: groupId,
        name,
        relationships: {},
        backgroundColor,
        textColor,
        pinXY,
      }

      group.personIds.forEach(linkTwoWays)
      return groupAsPerson

      // #region Legacy Group Update Helper Functions
      function linkTwoWays(personId: string) {
        const relPerson = legacyNetwork.people.find((p) => p.id === personId)
        if (!relPerson) return

        const defaultRel: IRelationship = { reason: "" }
        groupAsPerson.relationships[personId] = { ...defaultRel }
        relPerson.relationships[groupId] = { ...defaultRel }
      }
      // #endregion Legacy Group Update Helper Functions
    }

    // #endregion restructureLegacyGroup Helper Functions
  }

  function updatePersonCopyId(personCopy: IPerson) {
    const oldId = personCopy.id
    personCopy.id = uuidv4()
    peopleCopy.forEach(updatePersonIdInRels)

    // #region assignNewIds: HELPERS
    function updatePersonIdInRels(otherPerson: IPerson) {
      const { id: newId } = personCopy

      const hasRelationship = oldId in otherPerson.relationships
      if (!hasRelationship) return

      const relationshipCopy = otherPerson.relationships[oldId]
      delete otherPerson.relationships[oldId]

      otherPerson.relationships[newId] = relationshipCopy
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
}
