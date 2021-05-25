import firebase from "firebase"
import { v4 as uuidv4 } from "uuid"
import {
  auth,
  db,
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

      const uid = auth.currentUser?.uid
      if (uid) await importToFirestore(uid, currentNetworkCopy)
      if (!uid) dispatch(resetLocalNetworks()) // Clears array of networks in global state -- offline users can't use this since they only have IDs whose data cannot be fetched

      const action: IImportNetworkAction = {
        type: NetworkActionTypes.IMPORT_NETWORK,
        asCurrentNetwork: currentNetworkCopy,
      }

      return dispatch(action)
    } catch (error) {
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
  const networkRef = networksCollection.doc(toImport.id)
  if ((await networkRef.get()).exists)
    throw new Error("Network ID clashed with an existing network.")

  const batch = db.batch() // Batch the import operations -- this means nothing is saved unless everything is saved successfully

  const addToNetworkIds = {
    networkIds: firebase.firestore.FieldValue.arrayUnion(toImport.id),
  }
  const userRef = usersCollection.doc(uid)
  batch.update(userRef, addToNetworkIds)

  const { id, name, personIds } = toImport
  const networkToCreate: INetwork = { id, name, personIds }
  batch.set(networkRef, networkToCreate)

  for await (const p of toImport.people) {
    const personRef = await peopleCollection.doc(p.id)
    if ((await personRef.get()).exists)
      throw new Error("Person ID clashed with an existing person.")

    batch.set(personRef, p)
  }

  await batch.commit()
}
