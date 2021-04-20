import { AppThunk } from "../../store"
import {
  ConnectionShape,
  ISetRelationshipShape,
  NetworkActionTypes,
} from "../networkTypes"
import { setNetworkLoading } from "./setNetworkLoading"

/**
 * Update the connection shape at the end of a person's connection
 * @param networkId
 * @param personId
 * @param relationshipId
 * @param shape
 */

export const setRelationshipShape = (
  networkId: string,
  personId: string,
  relationshipId: string,
  shape: ConnectionShape,
): AppThunk => async (dispatch, getState) => {
  dispatch(setNetworkLoading(true))

  try {
    // const uid = getState().auth.userId
    // if (uid) updateShapeInFirestore()

    const action: ISetRelationshipShape = {
      type: NetworkActionTypes.SET_RELATIONSHIP_SHAPE,
      networkId,
      personId,
      relationshipId,
      shape,
    }

    return dispatch(action)
  } catch (error) {
    dispatch(setNetworkLoading(false))
    throw error
  }
}
