import { INetworkLoadingAction, NetworkActionTypes } from "../networkTypes"

// -== ACTION CREATORS ==- //
/* set isLoading state to true for async actions. Reducer will set isLoading to false for async actions.. */

export const setNetworkLoading = (
  isLoading: boolean,
): INetworkLoadingAction => ({
  type: NetworkActionTypes.LOADING,
  isLoading,
})
