import firebase from "firebase"
import {
  db,
  groupsCollection,
  networksCollection,
  peopleCollection,
} from "../../../firebase/services"
import { INetworkJSON } from "../../../helpers/getNetworkJSON"
import { ICurrentNetwork, IPerson, IRelationship } from "../networkTypes"

export interface ILegacyGroup {
  name: string
  personIds: string[]
  pinXY?: { x: number; y: number }
  backgroundColor?: string
  textColor?: string
}

export interface ILegacyGroupsNetwork {
  groupIds: string[]
  relationshipGroups: {
    [groupId: string]: ILegacyGroup
  }
}
export function restructureLegacyGroups(
  currentNetwork: ICurrentNetwork | INetworkJSON,
  doRestructureInFirestore = false,
) {
  if (!("relationshipGroups" in currentNetwork)) return
  console.log("LEGACY GROUPS DETECTED -- RESTRUCTURING TO NEW GROUPS FORMAT")

  const legacyNetwork: ICurrentNetwork & ILegacyGroupsNetwork = currentNetwork
  const groupsAsPeople = Object.entries(legacyNetwork.relationshipGroups).map(
    groupToPerson,
  )

  groupsAsPeople.forEach((p) => {
    legacyNetwork.people.push(p)
  })
  legacyNetwork.personIds = legacyNetwork.people.map((p) => p.id)

  delete currentNetwork["relationshipGroups"]
  delete currentNetwork["groupIds"]

  if (doRestructureInFirestore) restructureInFirestore(currentNetwork)

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

    if (!group.personIds) return groupAsPerson

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

function restructureInFirestore(currentNetwork: ICurrentNetwork) {
  const batch = db.batch()

  // Restructured groups should all be people now
  // And any people in the groups are now related to these groups
  // Update every person doc in the network to restructure the network!
  for (const person of currentNetwork.people) {
    const personRef = peopleCollection.doc(person.id)
    batch.set(personRef, person)
  }

  // Remove the groupIds field from the network doc
  const networkRef = networksCollection.doc(currentNetwork.id)
  batch.update(networkRef, {
    groupIds: firebase.firestore.FieldValue.delete(),
    personIds: currentNetwork.personIds,
  })

  // Remove legacy groups from groupsCollection
  const groups = currentNetwork.people.filter((p) => p.isGroup)
  for (const group of groups) {
    const groupRef = groupsCollection.doc(group.id)
    batch.delete(groupRef)
  }

  batch.commit()
}
