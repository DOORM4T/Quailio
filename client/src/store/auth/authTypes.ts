export interface IAuthState {
  isLoading: boolean
  userId: string | null | undefined
}

/* User Document type */
export interface IUserDocument {
  id: string
  email: string
  networkIds: string[] // IDs of networks belonging to the user
}

// -== ACTION TYPES ==- //
export enum AuthActionTypes {
  LOADING = "AUTH/LOADING",
  CREATE_ACCOUNT = "AUTH/CREATE_ACCOUNT",
  DELETE_ACCOUNT = "AUTH/DELETE_ACCOUNT",
  UPDATE_ACCOUNT = "AUTH/UPDATE_ACCOUNT",
  LOGIN = "AUTH/LOGIN",
  LOGOUT = "AUTH/LOGOUT",
  SET_USER = "AUTH/SET_USER",
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

export interface IAuthSetUserAction {
  type: AuthActionTypes.SET_USER
  userId: string
}

/* action types used by the networks reducer */
export type AuthActions =
  | IAuthLoading
  | IAuthCreateAccountAction
  | IAuthDeleteAccountAction
  | IAuthLoginAction
  | IAuthLogoutAction
  | IAuthSetUserAction
