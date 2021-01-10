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

export interface IApplicationState {
  networks: INetworksState
}

const rootReducer = combineReducers<IApplicationState>({
  networks: networksReducer,
})

export default function configureStore(): Store<IApplicationState> {
  const store = createStore(
    rootReducer,
    compose(
      applyMiddleware(thunk),
      // TODO: Remove in Production
      (window as any).__REDUX_DEVTOOLS_EXTENSION__ &&
        (window as any).__REDUX_DEVTOOLS_EXTENSION__(),
    ),
  )
  return store
}
