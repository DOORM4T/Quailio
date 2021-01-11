import {
  applyMiddleware,
  combineReducers,
  createStore,
  Store,
  compose,
} from "redux"
import thunk from "redux-thunk"

import { networksReducer } from "./networks/networksReducer"
import { INetworksState } from "./networks/networkTypes"
import { authReducer } from "./auth/authReducer"
import { IAuthState } from "./auth/authTypes"

export interface IApplicationState {
  networks: INetworksState
  auth: IAuthState
}

const rootReducer = combineReducers<IApplicationState>({
  networks: networksReducer,
  auth: authReducer,
})

export const store = createStore(
  rootReducer,
  compose(
    applyMiddleware(thunk),
    // TODO: Remove in Production
    (window as any).__REDUX_DEVTOOLS_EXTENSION__ &&
      (window as any).__REDUX_DEVTOOLS_EXTENSION__(),
  ),
)
