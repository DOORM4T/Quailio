import firebase from "firebase"
import { XYVals } from "../../../components/containers/ForceGraphCanvas/networkGraphTypes"
import { peopleCollection } from "../../../firebase/services"
import { AppThunk } from "../../store"
import { ISetNodeScaleAction, NetworkActionTypes } from "../networkTypes"
import { setNetworkLoading } from "./setNetworkLoading"

/**
 * Set a person's pin position for the Force Graph
 * @param networkId
 * @param personId
 * @param pinXY
 */
export const scalePerson = (
  networkId: string,
  personId: string,
  scaleXY?: XYVals,
): AppThunk => {
  return async (dispatch, getState) => {
    dispatch(setNetworkLoading(true))

    try {
      // Firestore updates if NOT in sharing mode and the user is authenticated
      const isSharing = getState().ui.isViewingShared // Viewers on a shared network should not be able to update the scaleXY in Firestore
      const uid = getState().auth.userId
      if (!isSharing && uid) await updateScaleInFirestore(personId, scaleXY)

      const action: ISetNodeScaleAction = {
        type: NetworkActionTypes.SET_PERSON_NODE_SCALE,
        networkId,
        personId,
        scaleXY,
      }

      return dispatch(action)
    } catch (error) {
      // Failed to set the person's scaleXY state
      dispatch(setNetworkLoading(false))
      throw error
    }
  }
}
async function updateScaleInFirestore(
  personId: string,
  scaleXY: XYVals | undefined,
) {
  const personDoc = await peopleCollection.doc(personId).get()
  if (!personDoc) throw new Error("That person does not exist.")

  // Updates JUST the scaleXY field on the document
  if (scaleXY === undefined) {
    // Remove the scaleXY field
    await personDoc.ref.update({
      pinXY: firebase.firestore.FieldValue.delete(),
    })
  } else {
    await personDoc.ref.update({ scaleXY })
  }
}
