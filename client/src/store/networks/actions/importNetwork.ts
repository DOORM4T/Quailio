import { v4 as uuidv4 } from "uuid"
import { INetworkJSON } from "../../../firebase/getNetworkJSON"
import { AppThunk } from "../../store"
import {
  ICurrentNetwork,
  IImportNetworkAction,
  NetworkActionTypes,
} from "../networkTypes"
import { setNetworkLoading } from "./setNetworkLoading"

/**
 * Create a new network
 * @param name
 */

export const importNetwork = (networkJSON: INetworkJSON): AppThunk => {
  return async (dispatch) => {
    dispatch(setNetworkLoading(true))

    // COPY THE NETWORK, BUT WITH NEW IDs
    // Give the network a new ID
    const newNetworkId = uuidv4()

    // Give each person a new ID
    const peopleCopy = [...networkJSON.people]
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
    })

    // Get all the updated person IDs
    const updatedPersonIds = peopleCopy.map((p) => p.id)

    try {
      /* Update state with the imported network */

      const asCurrentNetwork: ICurrentNetwork = {
        ...networkJSON,
        id: newNetworkId,
        people: peopleCopy,
        personIds: updatedPersonIds,
      }

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
