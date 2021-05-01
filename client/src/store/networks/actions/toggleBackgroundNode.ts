import { peopleCollection } from "../../../firebase/services"
import { AppThunk } from "../../store"
import {
  ISetPersonAsBackgroundNodeAction,
  NetworkActionTypes,
} from "../networkTypes"
import { setNetworkLoading } from "./setNetworkLoading"

/**
 * Toggle a person's isBackground state
 * @param networkId
 * @param personId
 * @param pinXY
 */
export const toggleBackgroundNode = (
  networkId: string,
  personId: string,
  isBackground: boolean,
): AppThunk => {
  return async (dispatch, getState) => {
    dispatch(setNetworkLoading(true))

    try {
      const isSharing = getState().ui.isViewingShared
      const uid = getState().auth.userId
      if (!isSharing && uid) {
        await updatePersonBackgroundStateInFirestore(personId, isBackground)
      }

      // Action to update state with the new person content
      const action: ISetPersonAsBackgroundNodeAction = {
        type: NetworkActionTypes.SET_PERSON_AS_BACKGROUND_NODE,
        networkId,
        personId,
        isBackground,
      }

      return dispatch(action)
    } catch (error) {
      // Failed to set the person's isBackground state
      dispatch(setNetworkLoading(false))
      throw error
    }
  }
}
async function updatePersonBackgroundStateInFirestore(
  personId: string,
  isBackground: boolean,
) {
  const personDoc = await peopleCollection.doc(personId).get()
  if (!personDoc) throw new Error("That person does not exist.")

  // Updates JUST the isBackground field on the document
  await personDoc.ref.update({ isBackground })
}
