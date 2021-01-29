import { Action, applyMiddleware, combineReducers, createStore } from "redux"
import thunk, { ThunkAction } from "redux-thunk"

import { networksReducer } from "./networks/networksReducer"
import { INetworksState } from "./networks/networkTypes"
import { authReducer } from "./auth/authReducer"
import { IAuthState } from "./auth/authTypes"

import { composeWithDevTools } from "redux-devtools-extension/developmentOnly"
import { IUserInterfaceState } from "./ui/uiTypes"
import { uiReducer } from "./ui/uiReducer"

/* Action Creator type for async Thunk actions */
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  IApplicationState,
  unknown,
  Action<string>
>

export interface IApplicationState {
  networks: INetworksState
  auth: IAuthState
  ui: IUserInterfaceState
}

const rootReducer = combineReducers<IApplicationState>({
  networks: networksReducer,
  auth: authReducer,
  ui: uiReducer,
})

export const store = createStore(
  rootReducer,
  composeWithDevTools(applyMiddleware(thunk)),
)
