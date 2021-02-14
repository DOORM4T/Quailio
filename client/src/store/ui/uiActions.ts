import { ActionCreator, AnyAction, Dispatch } from "redux"
import { ThunkAction } from "redux-thunk"
import {
  IPersonContentData,
  peopleCollection,
  personContentCollection,
} from "../../firebase/firebase"
import { store } from "../store"
import {
  IFocusOnPersonAction,
  IPersonWithContent,
  ISetPersonContentAction,
  ISetUILoadingAction,
  ITogglePersonEditMenu,
  IUserInterfaceState,
  UserInterfaceActionTypes,
} from "./uiTypes"

// -== ACTION CREATORS ==- //
export const setUILoading: ActionCreator<ISetUILoadingAction> = (
  isLoading: boolean,
) => ({
  type: UserInterfaceActionTypes.LOADING,
  isLoading,
})

/**
 * Add a new Person to an existing Network
 * @param networkId ID of the network to add the person to
 * @param name new person's name
 */
export const setPersonInFocus: ActionCreator<
  ThunkAction<
    Promise<AnyAction>,
    IUserInterfaceState,
    null,
    IFocusOnPersonAction
  >
> = (personId: string | null) => {
  return async (dispatch: Dispatch) => {
    dispatch(setUILoading(true))
    try {
      const currentNetwork = store.getState().networks.currentNetwork
      if (!currentNetwork) throw new Error("No network is currently selected.")

      /* Get the Person */
      const person: IPersonWithContent | null = currentNetwork
        ? currentNetwork.people.find((p) => p.id === personId) ?? null // If person not found, return null instead of undefined
        : null

      /* Get the Person's rich text content, if they exist */
      let personContent = ""
      if (person !== null) {
        const personContentDoc = personContentCollection.doc(person.id)
        const doesExist = (await personContentDoc.get()).exists

        /* Set the Person's content, if it exists */
        if (doesExist) {
          const personContentData = (
            await personContentDoc.get()
          ).data() as IPersonContentData
          personContent = personContentData.content
        }
      }

      return dispatch({
        type: UserInterfaceActionTypes.FOCUS_ON_PERSON,
        person,
        personContent,
      })
    } catch (error) {
      /* Failed to focus on the Person */
      dispatch(setUILoading(false))
      throw error
    }
  }
}

/**
 * Set a person's rich text content
 * @param personId
 * @param content
 */
export const setPersonContent: ActionCreator<
  ThunkAction<
    Promise<AnyAction>,
    IUserInterfaceState,
    null,
    ISetPersonContentAction
  >
> = (personId: string, content: string) => {
  return async (dispatch: Dispatch) => {
    dispatch(setUILoading(true))

    try {
      const personDoc = peopleCollection.doc(personId)

      /* Ensure the Person exists */
      const doesExist = (await personDoc.get()).exists
      if (!doesExist) throw new Error("That person does not exist.")

      /* Set the Person's content in a separate personContent collection */
      const personContentData: IPersonContentData = { content }
      await personContentCollection.doc(personId).set(personContentData)

      return dispatch({
        type: UserInterfaceActionTypes.SET_PERSON_CONTENT,
        personId,
        content,
      })
    } catch (error) {
      /* Failed to set the Person's thumbnail url*/
      dispatch(setUILoading(false))
      throw error
    }
  }
}

export const togglePersonEditMenu: ActionCreator<ITogglePersonEditMenu> = (
  isOpen: boolean,
) => ({
  type: UserInterfaceActionTypes.TOGGLE_PERSON_EDIT_MENU,
  isOpen,
})
