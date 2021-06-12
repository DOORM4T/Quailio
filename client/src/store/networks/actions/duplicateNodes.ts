import { v4 as uuidv4 } from "uuid"
import { XYVals } from "../../../components/containers/ForceGraphCanvas/networkGraphTypes"
import { AppThunk } from "../../store"
import { addPersonToFirestore } from "../helpers/addPersonToFirestore"
import {
  IDuplicateNodesAction,
  IPerson,
  NetworkActionTypes,
} from "../networkTypes"
import { setNetworkLoading } from "./setNetworkLoading"

/**
 * Add a new Person to an existing Network
 * @param networkId ID of the network to add the person to
 * @param name new person's name
 */
export const duplicateNodes = (
  networkId: string,
  nodeIds: string[],
  options: {
    clearFormatting?: boolean
    pin?: {
      anchor: XYVals
      target: XYVals
    }
  } = { clearFormatting: false },
): AppThunk => {
  return async (dispatch, getState) => {
    dispatch(setNetworkLoading(true))

    try {
      const people = getState().networks.currentNetwork?.people
      if (!people) throw new Error("Missing people")

      const nodes = nodeIds
        .map((id) => people.find((p) => p.id === id))
        .filter((n) => n !== undefined) as IPerson[]

      const nodeCopies = nodes.map((n) => {
        const copy = { ...n }
        copy.id = uuidv4()

        if (options?.clearFormatting) {
          // Clear formatting: makes the copy a standalone node with no relationships
          copy.relationships = {}
        } else {
          copy.name = n.name + " [COPY]"
          // Copy relationships -- make other nodes relate to the copy
          Object.keys(copy.relationships).forEach((relId) => {
            const relatedPerson = people.find((p) => p.id === relId)
            if (!relatedPerson) return
            relatedPerson.relationships[copy.id] = copy.relationships[relId]
          })
        }

        const pin = options?.pin
        if (pin) {
          const copyX = copy.pinXY?.x ? copy.pinXY.x : 0
          const copyY = copy.pinXY?.y ? copy.pinXY.y : 0
          const deltaX = copyX - pin.anchor.x
          const deltaY = copyY - pin.anchor.y
          copy.pinXY = { x: pin.target.x + deltaX, y: pin.target.y + deltaY }
        }
        return copy
      })

      // Update the database if the user is authenticated
      const isAuthenticated = Boolean(getState().auth.userId)
      if (isAuthenticated) {
        for await (const copy of nodeCopies) {
          await addPersonToFirestore(networkId, copy)
        }
      }

      const action: IDuplicateNodesAction = {
        type: NetworkActionTypes.DUPLICATE_NODES,
        networkId,
        nodeCopies,
      }
      return dispatch(action)
    } catch (error) {
      // Failed to add the new Person
      dispatch(setNetworkLoading(false))
      throw error
    }
  }
}
