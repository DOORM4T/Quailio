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
  IRelationshipGroups,
  NetworkActionTypes,
} from "../networkTypes"
import { setNetworkLoading } from "./setNetworkLoading"

/**
 * Create a new network
 * @param name
 */

export const importNetwork = (networkJSON: INetworkJSON): AppThunk => {
  return async (dispatch, getState) => {
    dispatch(setNetworkLoading(true))

    // COPY THE NETWORK, BUT WITH NEW IDs
    // Give the network a new ID
    const newNetworkId = uuidv4()

    // Will update groups and people with new IDs
    const groupsCopy: IRelationshipGroups = {
      ...networkJSON.relationshipGroups,
    }
    const peopleCopy: IPerson[] = [...networkJSON.people]

    // Update all group IDs
    Object.keys(groupsCopy).forEach((groupId) => {
      // Copy the group data before deleting the old key-value pair
      const groupData = { ...groupsCopy[groupId] }

      // Delete the old key-value pair
      const newGroupId = uuidv4()
      delete groupsCopy[groupId]

      // Create the new key-value pair with the updated ID as the key
      groupsCopy[newGroupId] = groupData
    })

    // Give each person a new ID
    peopleCopy.forEach((p) => {
      // Remember the old ID
      const oldId = p.id

      // Assign a new ID
      p.id = uuidv4()

      // Update all relationships
      peopleCopy.forEach((otherPerson) => {
        // Ensure the person has a relationship with the person whose ID we are updating
        const hasRelationship = oldId in otherPerson.relationships
        if (!hasRelationship) return

        // Copy the relationship using the old ID
        const relationshipCopy = otherPerson.relationships[oldId]
        // Delete the existing relationship using the old ID
        delete otherPerson.relationships[oldId]

        // Re-create the relationship with the new ID
        otherPerson.relationships[p.id] = relationshipCopy
      })

      // Update all groups
      Object.keys(groupsCopy).forEach((groupId) => {
        const group = groupsCopy[groupId]

        // Replace the current person's old ID with their new one
        const personIdIndex = group.personIds.findIndex((pid) => pid === oldId)
        if (personIdIndex === -1) return // Stop if the current person's ID wasn't found

        group.personIds[personIdIndex] = p.id
      })
    })

    // Get all the updated person IDs
    const updatedPersonIds = peopleCopy.map((p) => p.id)

    // Get all the updated group IDs
    const updatedGroupIds = Object.keys(groupsCopy)

    // Format as a CurrentNetwork
    const asCurrentNetwork: ICurrentNetwork = {
      ...networkJSON,
      id: newNetworkId,
      people: peopleCopy,
      personIds: updatedPersonIds,
      groupIds: updatedGroupIds,
      relationshipGroups: groupsCopy,
    }

    try {
      // Import to the Firestore if the user is authenticated (Offline users can still import; their data just isn't stored in Firestore)
      const uid = getState().auth.userId
      if (uid) {
        // Add the network's ID to the user doc networks list
        const addToNetworkIds: { networkIds: any } = {
          networkIds: firebase.firestore.FieldValue.arrayUnion(
            asCurrentNetwork.id,
          ),
        }
        await usersCollection.doc(uid).update(addToNetworkIds)

        //
        // Add the network
        //
        const networkDoc = await networksCollection
          .doc(asCurrentNetwork.id)
          .get()

        // Ensure the network doesn't already exist (in case the new UUID clashes, under astronomical odds)
        if (networkDoc.exists)
          throw new Error(
            "Network ID clashed with an existing network. How unfortunate!",
          )

        // Actually add the network
        const network: INetwork = {
          id: asCurrentNetwork.id,
          name: asCurrentNetwork.name,
          personIds: asCurrentNetwork.personIds,
          groupIds: asCurrentNetwork.groupIds, // TODO: Update group IDs
        }
        await networkDoc.ref.set(network)

        //
        // Add every person
        //
        const uploadPersonPromises = asCurrentNetwork.people.map(async (p) => {
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
      }

      // Action to import the network to global state
      const action: IImportNetworkAction = {
        type: NetworkActionTypes.IMPORT_NETWORK,
        asCurrentNetwork,
      }
      return dispatch(action)
    } catch (error) {
      /* Failed to import the Network */
      dispatch(setNetworkLoading(false))
      throw error
    }
  }
}
