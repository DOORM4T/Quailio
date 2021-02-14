import {
  networksCollection,
  peopleCollection,
} from "../../../firebase/firebase"
import { AppThunk } from "../../store"
import {
  IConnectPeopleAction,
  INetwork,
  IPerson,
  IRelationships,
  NetworkActionTypes,
} from "../networkTypes"
import { setNetworkLoading } from "./setNetworkLoading"

/**
 * Connect two People in some network
 * @param networkId
 * @param relationship
 */

export const connectPeople = (
  networkId: string,
  relationship: {
    p1Id: string
    p2Id: string
    p1Reason: string
    p2Reason: string
  },
): AppThunk => {
  return async (dispatch) => {
    dispatch(setNetworkLoading(true))

    const { p1Id, p2Id, p1Reason = "", p2Reason = "" } = relationship

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

      /* Copy existing relationships and add the new relationship for each person */
      const updatedP1Rels: IRelationships = {
        ...p1Data.relationships,
        [p2Id]: [p1Reason, p2Reason],
      }
      const updatedP2Rels: IRelationships = {
        ...p2Data.relationships,
        [p1Id]: [p2Reason, p1Reason],
      }

      /* Update just the "relationships" field in each Person document */
      await p1Doc.update({ relationships: updatedP1Rels })
      await p2Doc.update({ relationships: updatedP2Rels })

      const updatedP1Data: IPerson = { ...p1Data, relationships: updatedP1Rels }
      const updatedP2Data: IPerson = { ...p2Data, relationships: updatedP2Rels }

      /* Update state to reflect the new connection */
      const action: IConnectPeopleAction = {
        type: NetworkActionTypes.CONNECT_PEOPLE,
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
