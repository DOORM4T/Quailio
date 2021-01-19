import { ActionCreator, AnyAction, Dispatch } from "redux"
import { ThunkAction } from "redux-thunk"
import { auth, db } from "../../firebase"
import { resetLocalNetworks } from "../networks/networksActions"
import {
  AuthActionTypes,
  IAuthCreateAccountAction,
  IAuthDeleteAccountAction,
  IAuthLoading,
  IAuthLoginAction,
  IAuthLogoutAction,
  IAuthSetUserAction,
  IAuthState,
} from "./authTypes"

const collection = db.collection("networks")

// -== ACTION CREATORS ==- //
/* set isLoading state to true for async actions. Reducer will set isLoading to false for async actions.. */
export const setAuthLoading: ActionCreator<IAuthLoading> = (
  isLoading: boolean,
) => ({
  type: AuthActionTypes.LOADING,
  isLoading,
})

export const createAccount: ActionCreator<
  ThunkAction<Promise<AnyAction>, IAuthState, null, IAuthCreateAccountAction>
> = (email: string, password: string) => {
  return async (dispatch: Dispatch) => {
    dispatch(setAuthLoading(true))

    try {
      const credentials = await auth.createUserWithEmailAndPassword(
        email,
        password,
      )

      /* id used to refer to the user's networks database */
      const id = credentials.user!.uid
      return dispatch({
        type: AuthActionTypes.CREATE_ACCOUNT,
        id,
      })
    } catch (error) {
      dispatch(setAuthLoading(false))
      throw error
    }
  }
}

export const login: ActionCreator<
  ThunkAction<Promise<AnyAction>, IAuthState, null, IAuthLoginAction>
> = (email: string, password: string) => {
  return async (dispatch: Dispatch) => {
    dispatch(setAuthLoading(true))

    try {
      const credentials = await auth.signInWithEmailAndPassword(email, password)
      const id = credentials.user!.uid
      return dispatch({
        type: AuthActionTypes.LOGIN,
        id,
      })
    } catch (error) {
      dispatch(setAuthLoading(false))
      throw error
    }
  }
}

export const logout: ActionCreator<
  ThunkAction<Promise<AnyAction>, IAuthState, null, IAuthLogoutAction>
> = () => {
  return async (dispatch: Dispatch) => {
    dispatch(setAuthLoading(true))

    try {
      await auth.signOut()
      dispatch(resetLocalNetworks())
    } catch (error) {
      dispatch(setAuthLoading(false))
      throw error
    }

    return dispatch({
      type: AuthActionTypes.LOGOUT,
    })
  }
}

export const deleteAccount: ActionCreator<
  ThunkAction<Promise<AnyAction>, IAuthState, null, IAuthDeleteAccountAction>
> = () => {
  return async (dispatch: Dispatch) => {
    dispatch(setAuthLoading(true))

    try {
      if (!auth.currentUser) throw new Error("no user is currently logged in")
      const userId = auth.currentUser.uid

      /* delete the current user */
      await auth.currentUser.delete()

      /* delete the user's Firebase document */
      await collection.doc(userId).delete()

      // TODO: FIX: local state not resetting after deleting account.
      /* reset local network state */
      dispatch(resetLocalNetworks())

      return dispatch({
        type: AuthActionTypes.DELETE_ACCOUNT,
        didDelete: true,
      })
    } catch (error) {
      dispatch(setAuthLoading(false))
      throw error
    }
  }
}

export const setUser: ActionCreator<IAuthSetUserAction> = (userId: string) => ({
  type: AuthActionTypes.SET_USER,
  userId,
})
