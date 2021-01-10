import { IPersonProperties } from "../networks/networkTypes"

export interface IAuthState {
  isLoading: boolean
  userId: string | null
}

// -== ACTION TYPES ==- //
export enum AuthActionTypes {
  LOADING = "AUTH/LOADING",
  CREATE_ACCOUNT = "AUTH/CREATE_ACCOUNT",
  DELETE_ACCOUNT = "AUTH/DELETE_ACCOUNT",
  UPDATE_ACCOUNT = "AUTH/UPDATE_ACCOUNT",
  LOGIN = "AUTH/LOGIN",
  LOGOUT = "AUTH/LOGOUT",
}

export interface IAuthLoading {
  type: AuthActionTypes.LOADING
  isLoading: boolean
}

export interface IAuthCreateAccountAction {
  type: AuthActionTypes.CREATE_ACCOUNT
  id: string | null
}

export interface IAuthDeleteAccountAction {
  type: AuthActionTypes.DELETE_ACCOUNT
  didDelete: boolean
}

// TODO: Update user account details
// export interface IAuthUpdateAccountAction {
//   type: AuthActionTypes.UPDATE_ACCOUNT
//   content: IPersonProperties
// }

export interface IAuthLoginAction {
  type: AuthActionTypes.LOGIN
  id: string | null
}

export interface IAuthLogoutAction {
  type: AuthActionTypes.LOGOUT
}

/* action types used by the networks reducer */
export type AuthActions =
  | IAuthLoading
  | IAuthCreateAccountAction
  | IAuthDeleteAccountAction
  | IAuthLoginAction
  | IAuthLogoutAction
