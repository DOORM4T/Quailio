import { ActionCreator, AnyAction, Dispatch } from "redux"
import { ThunkAction } from "redux-thunk"

import { auth } from "../../firebase"

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

      console.log("CREATED ACCOUNT")

      /* id used to refer to the user's networks database */
      const id = credentials.user!.uid
      return dispatch({
        type: AuthActionTypes.CREATE_ACCOUNT,
        id,
      })
    } catch (error) {
      /* failed to create account */
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
    } catch (error) {
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
      /* try to delete the current user, if there is one */
      if (auth.currentUser) await auth.currentUser.delete()
      return dispatch({
        type: AuthActionTypes.DELETE_ACCOUNT,
        didDelete: true,
      })
    } catch (error) {
      console.error(error)
      return dispatch({
        type: AuthActionTypes.DELETE_ACCOUNT,
        didDelete: false,
      })
    }
  }
}

export const setUser: ActionCreator<IAuthSetUserAction> = (userId: string) => ({
  type: AuthActionTypes.SET_USER,
  userId,
})
