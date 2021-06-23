import { v4 as uuidv4 } from "uuid"
import { AppThunk } from "../../store"
import { pushActionToStack } from "../../ui/uiActions"
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
 */
export const addPerson = (
  networkId: string,
  name: string,
  pinXY?: { x: number; y: number },
): AppThunk => {
  return async (dispatch, getState) => {
    dispatch(setNetworkLoading(true))

    // Initialize the new Person's document
    const id = uuidv4()
    const newPerson: IPerson = {
      id,
      name,
      relationships: {},
      content: "",
    }

    // An undefined pinXY would break adding the person to Firestore because Firestore doesn't support undefined fields
    if (pinXY !== undefined) newPerson.pinXY = pinXY

    try {
      // Update the database if the user is authenticated
      const isAuthenticated = Boolean(getState().auth.userId)
      if (isAuthenticated) await addPersonToFirestore(networkId, newPerson)

      // #region Add to the UNDO stack
      // Undoing a CREATE action means we DELETE the person
      const undoAction: IDeletePersonStackAction = {
        type: StackActionTypes.DELETE,
        payload: { id, name },
      }
      dispatch(pushActionToStack("undo", [undoAction]))
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
