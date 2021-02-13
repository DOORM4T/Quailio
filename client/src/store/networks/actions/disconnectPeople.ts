import { networksCollection, peopleCollection } from "../../../firebase"
import { AppThunk } from "../../store"
import {
  IDisconnectPeopleAction,
  INetwork,
  IPerson,
  IRelationships,
  NetworkActionTypes,
} from "../networkTypes"
import { setNetworkLoading } from "./setNetworkLoading"

/**
 * Disconnect two People in some network
 * @param networkId
 * @param relationship
 */

export const disconnectPeople = (
  networkId: string,
  relationship: {
    p1Id: string
    p2Id: string
  },
): AppThunk => {
  return async (dispatch) => {
    dispatch(setNetworkLoading(true))

    const { p1Id, p2Id } = relationship

    try {
      /* Database updates */
      /* Ensure each person exists in the network */
      const network = (
        await networksCollection.doc(networkId).get()
      ).data() as INetwork
      const hasP1 = network.personIds.some((id) => id === p1Id)
      const hasP2 = network.personIds.some((id) => id === p2Id)
      if (!hasP1 || !hasP2)
        throw new Error("One or both persons do not exist in that network.")

      /* Get the Firestore documents for each Person */
      const p1Doc = peopleCollection.doc(p1Id)
      const p2Doc = peopleCollection.doc(p2Id)

      /* Get the document data for each person */
      const p1Data: IPerson = (await p1Doc.get()).data() as IPerson
      const p2Data: IPerson = (await p2Doc.get()).data() as IPerson

      /* Copy existing relationships */
      const updatedP1Rels: IRelationships = { ...p1Data.relationships }
      const updatedP2Rels: IRelationships = { ...p2Data.relationships }

      /* Delete the relationship with the other person */
      delete updatedP1Rels[p2Id]
      delete updatedP2Rels[p1Id]

      /* Update just the "relationships" field in each Person document */
      await p1Doc.update({ relationships: updatedP1Rels })
      await p2Doc.update({ relationships: updatedP2Rels })

      const updatedP1Data: IPerson = { ...p1Data, relationships: updatedP1Rels }
      const updatedP2Data: IPerson = { ...p2Data, relationships: updatedP2Rels }

      /* Update state to reflect the new connection */
      const action: IDisconnectPeopleAction = {
        type: NetworkActionTypes.DISCONNECT_PEOPLE,
        updatedP1Data,
        updatedP2Data,
      }
      return dispatch(action)
    } catch (error) {
      /* Failed to connect */
      dispatch(setNetworkLoading(false))
      throw error
    }
  }
}
