import { Reducer } from "redux"
import {} from "./authActions"
import { AuthActions, AuthActionTypes, IAuthState } from "./authTypes"

const initialState: IAuthState = {
  isLoading: false,
  userId: undefined,
}

export const authReducer: Reducer<IAuthState, AuthActions> = (
  state = initialState,
  action,
): IAuthState => {
  switch (action.type) {
    // SET LOADING TO true
    case AuthActionTypes.LOADING: {
      return { ...state, isLoading: action.isLoading }
    }

    case AuthActionTypes.CREATE_ACCOUNT: {
      return {
        ...state,
        userId: action.id,
        isLoading: false,
      }
    }

    case AuthActionTypes.LOGIN: {
      return {
        ...state,
        userId: action.id,
        isLoading: false,
      }
    }

    case AuthActionTypes.LOGOUT: {
      return {
        ...state,
        userId: null,
        isLoading: false,
      }
    }

    case AuthActionTypes.DELETE_ACCOUNT: {
      /* stop if the user account deletion failed */
      if (!action.didDelete) break

      return {
        ...state,
        userId: null,
        isLoading: false,
      }
    }

    case AuthActionTypes.SET_USER: {
      return {
        ...state,
        userId: action.userId,
        isLoading: false,
      }
    }
  }
  return state
}
