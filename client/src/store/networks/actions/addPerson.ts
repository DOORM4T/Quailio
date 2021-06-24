import { v4 as uuidv4 } from "uuid"
import { AppThunk } from "../../store"
import { pushActionToUndoStack } from "../../ui/uiActions"
import { IDeletePersonStackAction, StackActionTypes } from "../../ui/uiTypes"
import { addPersonToFirestore } from "../helpers/addPersonToFirestore"
import { IAddPersonAction, IPerson, NetworkActionTypes } from "../networkTypes"
import { setNetworkLoading } from "./setNetworkLoading"

/**
 * Add a new Person to an existing Network
 *
 * THIS ACTION IS UNDO-ABLE
 * @param networkId ID of the network to add the person to
 * @param name new person's name
 * @param pinXY xy coords to pin the person node at
 * @param doAddToUndoStack whether to add the opposite action to the undo stack (should explicitly set to false when calling this action from the popAction in uiActions to avoid unecessary pushes to the undo stack)
 * @param existingId ID to create the person node from. Randomly generated if unspecified
 */
export const addPerson = (
  networkId: string,
  name: string,
  pinXY?: { x: number; y: number },
  doAddToUndoStack: boolean = true,
  existingPerson?: IPerson,
): AppThunk => {
  return async (dispatch, getState) => {
    dispatch(setNetworkLoading(true))

    // Initialize the new Person's document
    const newPerson: IPerson = existingPerson || {
      id: uuidv4(),
      name,
      relationships: {},
      content: "",
    }

    if (pinXY !== undefined)
      // An undefined pinXY would break adding the person to Firestore because Firestore doesn't support undefined fields
      newPerson.pinXY = pinXY

    try {
      const doesIdClash = getState().networks.currentNetwork?.personIds.some(
        (id) => id === newPerson.id,
      )
      if (doesIdClash) throw new Error("Failed to create person: ID clash")

      // Update the database if the user is authenticated
      const isAuthenticated = Boolean(getState().auth.userId)
      if (isAuthenticated) await addPersonToFirestore(networkId, newPerson)

      // #region Add to the UNDO stack
      // Undoing a CREATE action means we DELETE the person
      if (doAddToUndoStack) {
        const undoAction: IDeletePersonStackAction = {
          type: StackActionTypes.DELETE,
          payload: newPerson,
        }
        dispatch(pushActionToUndoStack([undoAction]))
      }
      // //#endregion

      const action: IAddPersonAction = {
        type: NetworkActionTypes.ADD_PERSON,
        personData: newPerson,
      }
      return dispatch(action)
    } catch (error) {
      // Failed to add the new Person
      dispatch(setNetworkLoading(false))
      throw error
    }
  }
}
