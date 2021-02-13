import { IResetClientNetworksAction, NetworkActionTypes } from "../networkTypes"

/**
 * Reset local network state. Called when the logout/delete account actions are successful.
 */

export const resetLocalNetworks = (): IResetClientNetworksAction => ({
  type: NetworkActionTypes.RESET_CLIENT,
})
