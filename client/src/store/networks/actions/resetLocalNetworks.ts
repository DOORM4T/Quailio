import { IResetClientNetworksAction, NetworkActionTypes } from "../networkTypes"

/**
 * Reset local network state. Called when with the login/logout/delete account actions
 */

export const resetLocalNetworks = (): IResetClientNetworksAction => ({
  type: NetworkActionTypes.RESET_CLIENT,
})
